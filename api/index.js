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

    // 2. Autentica no Twitter
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    // 3. Busca o último tweet do perfil
    const user = await client.v2.me();
    const timeline = await client.v2.userTimeline(user.data.id, { max_results: 10 });
    const alreadyPosted = timeline.data?.data?.some(tweet => tweet.text.includes(link));

    if (alreadyPosted) {
      return res.status(200).json({ message: 'Já publicado anteriormente. Nenhuma ação tomada.' });
    }

    // 4. Monta os tweets
    const invisibleChar = "\u200B";
    const firstTweet = `📝 Novo Bom Digma:\n\n${title}\n\n${summary}...${invisibleChar}`;
    const secondTweet = `🔗 Leia a edição completa: ${link}`;

    // 5. Publica o primeiro tweet
    const { data: tweet } = await client.v2.tweet(firstTweet);

    // 6. Responde com o link
    await client.v2.reply(secondTweet, tweet.id);

    res.status(200).json({ message: 'Thread postada com sucesso!' });
  } catch (error) {
    console.error('Erro detalhado:', error);
    res.status(500).json({ error: error.message });
  }
};
