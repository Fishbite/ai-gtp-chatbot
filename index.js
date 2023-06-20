import { Configuration, OpenAIApi } from "openai";
import { process } from "./env";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const chatbotConversation = document.getElementById("chatbot-conversation");

// A single source of truth. Everything we ask of the ai and everything
// it responds with is stored in this array
const conversationArr = [
  {
    role: "system", // this tells the ai that an instruction follows
    // this is the instruction to the ai & not part of the conversation
    content:
      "You are a highly knowledgeable assistant that gives short concise answers",
  },
];

document.addEventListener("submit", (e) => {
  e.preventDefault();

  const userInput = document.getElementById("user-input");

  // add an object holding the user's input to the conversation array
  conversationArr.push({
    role: "user",
    content: userInput.value,
  });

  const newSpeechBubble = document.createElement("div");
  newSpeechBubble.classList.add("speech", "speech-human");
  chatbotConversation.appendChild(newSpeechBubble);
  newSpeechBubble.textContent = userInput.value;
  userInput.value = "";
  chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
});

function renderTypewriterText(text) {
  const newSpeechBubble = document.createElement("div");
  newSpeechBubble.classList.add("speech", "speech-ai", "blinking-cursor");
  chatbotConversation.appendChild(newSpeechBubble);
  let i = 0;
  const interval = setInterval(() => {
    newSpeechBubble.textContent += text.slice(i - 1, i);
    if (text.length === i) {
      clearInterval(interval);
      newSpeechBubble.classList.remove("blinking-cursor");
    }
    i++;
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
  }, 50);
}
