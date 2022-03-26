require('dotenv').config();
const { App } = require('@slack/bolt');

const workSpace = process.env.SLACK_WORK_SPACE_URL;
const archives = 'archives';

// ボットトークンとソケットモードハンドラーを使ってアプリを初期化します
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// "hello" を含むメッセージをリッスンします
app.message('hello', async ({ message, say }) => {
  // イベントがトリガーされたチャンネルに say() でメッセージを送信します
  await say({
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Hey there <@${message.user}>!`
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Click Me"
          },
          "action_id": "button_click"
        }
      }
    ],
    text: `Hey2 there <@${message.user}>!`
  });
});

app.event('reaction_added', async ({ event, say, client }) => {
  await say(event.reaction);

  if (event.reaction === 'eyes') {
    const formatTs = event.item.ts.replace('.', '')

    // TODO 転送先チャンネル情報取得
    // TODO 転送先チャンネルの配列でまわして一つずつ投稿（Promise.allでも）
    await client.chat.postMessage({
      channel: process.env.SLACK_SHARE_CHANNEL,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `共有だよ　${workSpace}/${archives}/${event.item.channel}/p${formatTs}`
          },
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '返信する場合は、このボタンから転送元のスレッドに返信できるよ'
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'OKと返信',
              },
              action_id: 'rep_share_ok_button'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'NGと返信',
              },
              action_id: 'rep_share_ng_button'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'カスタムテキストで返信',
              },
              action_id: 'rep_share_custom_button'
            }
          ]
        }
      ],
      text: `${workSpace}/${archives}/${event.item.channel}/p${formatTs}`
    })
  }
});

app.action('rep_share_ok_button', async ({ body, ack, client }) => {
  // アクションのリクエストを確認
  await ack();
  console.log(body)

  // 転送元 URL 部分を分解
  const regex = /https:\/\/[\w-]+\.slack\.com\/archives\/([\w]+)\/p([\d.]+)/
  const url = body.message.text.match(regex);
  const channel = url[1];
  const ts = url[2];

  await client.chat.postMessage({
    channel,
    thread_ts: `${ts.substring(0, ts.length - 6)}.${ts.substring(ts.length - 6)}}`,
    text: `<#${body.container.channel_id}> から返信：OK`
  })
});

app.action('rep_share_ng_button', async ({ body, ack, client }) => {
  await ack();

  // 転送元 URL 部分を分解
  const regex = /https:\/\/[\w-]+\.slack\.com\/archives\/([\w]+)\/p([\d.]+)/
  const url = body.message.text.match(regex);
  const channel = url[1];
  const ts = url[2];

  await client.chat.postMessage({
    channel,
    thread_ts: `${ts.substring(0, ts.length - 6)}.${ts.substring(ts.length - 6)}}`,
    text: `<#${body.container.channel_id}> から返信：NG`
  })
});

app.action('rep_share_custom_button', async ({ body, ack, client }) => {
  await ack();

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      // callback_id が view を特定するための識別子
      callback_id: 'rep_share_custom_text',
      title: {
        type: 'plain_text',
        text: 'カスタムテキストで返信'
      },
      blocks: [
        {
          type: 'input',
          block_id: 'custom_response_block',
          label: {
            type: 'plain_text',
            text: '返信する内容を書いてね'
          },
          element: {
            type: 'plain_text_input',
            action_id: 'custom_response',
            multiline: true,
          }
        }
      ],
      submit: {
        type: 'plain_text',
        text: 'Submit'
      },
      private_metadata: body.message.text
    },
  })
});

app.view('rep_share_custom_text', async ({ ack, view, client }) => {
  await ack();

  const regex = /https:\/\/[\w-]+\.slack\.com\/archives\/([\w]+)\/p([\d.]+)/
  const url = view.private_metadata.match(regex);
  const channel = url[1];
  const ts = url[2];

  await client.chat.postMessage({
    channel,
    thread_ts: `${ts.substring(0, ts.length - 6)}.${ts.substring(ts.length - 6)}}`,
    text: `<#${channel}> から返信：\n\n${view.state.values.custom_response_block.custom_response.value}`
  });
});


(async () => {
  // アプリを起動します
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();
