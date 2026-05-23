const message = "Hello Thozhi";
const lowerMsg = message.toLowerCase().trim();
const greetings = ["hi", "hello", "hey", "hii", "good morning", "good evening", "thozhi"];
const match = greetings.some(g => lowerMsg.includes(g) && lowerMsg.length < 15);
console.log("LowerMsg:", lowerMsg);
console.log("Match:", match);
