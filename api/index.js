const Parser = require('rss-parser');
const { TwitterApi } = require('twitter-api-v2');

module.exports = async (req, res) => {
  try {
    // 1. Lê o RSS
    const parser = new Parser();
    const feed = await parser.parseURL('https://www.bomdigma.com.br/feed');
    const latest = feed.items[0];
    const title = latest.title;
    const summary = latest.contentSnippet ? latest.contentSnippet.substring(0, 200) : '';
    const link = latest.link;

    // 2. Monta os tweets
    const invisibleChar = "\u200B";
    const firstTweet = `📝 Novo Bom Digma:\n\n${title}\n\n${summary}...${invisibleChar}`;
    const secondTweet = `🔗 Leia a edição completa: ${link}`;

    // 3. Autentica no Twitter
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    // 4. Publica o primeiro tweet
    const { data: tweet } = await client.v2.tweet(firstTweet);

    // 5. Responde com o link
    await client.v2.reply(secondTweet, tweet.id);

    res.status(200).json({ message: 'Thread postada com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
 
