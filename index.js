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
    // you can set the 'personality' of the ai with this
    content:
      "You are a knowledgeable but grumpy old fart that only gives short bad tempered answers",
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

  fetchReply();

  const newSpeechBubble = document.createElement("div");
  newSpeechBubble.classList.add("speech", "speech-human");
  chatbotConversation.appendChild(newSpeechBubble);
  newSpeechBubble.textContent = userInput.value;
  userInput.value = "";
  chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
});

async function fetchReply() {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: conversationArr,
    // Advice: keep vals between 1 & -1 freq_pen best set at 0.3
    presence_penalty: 0, // vals between 2.0 & -2.0 increments 0.01 higher vals increase the likelihood of the ai talking about new topics
    frequency_penalty: 0.3, // vals between 2.0 & -2.0 higher vals decrease the likelihood of the ai repeating the exact same phrases
  });

  console.log(response);

  const answer = response.data.choices[0].message.content;
  const msgObj = response.data.choices[0].message;

  renderTypewriterText(answer);
  conversationArr.push(msgObj);
  console.log(conversationArr);
}

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
