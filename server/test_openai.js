const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function test() {
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say OK" }],
    });
    console.log("SUCCESS");
    console.log(res.choices[0].message.content);
  } catch (err) {
    console.error("FAILED");
    console.error(err.message);
  }
}

test();
