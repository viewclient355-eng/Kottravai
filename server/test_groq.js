const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function test() {
  try {
    const chat = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Analyze this B2B lead" }],
      model: "llama-3.3-70b-versatile",
    });
    console.log(chat.choices[0].message.content);
  } catch (err) {
    console.error("FAILED");
    console.error(err.message);
  }
}

test();
