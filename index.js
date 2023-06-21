import { Configuration, OpenAIApi } from "openai";
import { process } from "./env";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ***** firebase **** */

// https://grumpy-bot-default-rtdb.europe-west1.firebasedatabase.app/

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, get } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const appSettings = {
  apiKey: "AIzaSyBZJVj6oI-H5qfvDRKrMicVPwKrkZWZKPg",
  authDomain: "grumpy-bot.firebaseapp.com",
  databaseURL:
    "https://grumpy-bot-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "grumpy-bot",
  storageBucket: "grumpy-bot.appspot.com",
  messagingSenderId: "1095213259424",
  appId: "1:1095213259424:web:41acf3b7911af8f78887c5",
};

// Initialize Firebase
const app = initializeApp(appSettings);

const database = getDatabase(app);

const conversationInDb = ref(database); // single source of truth for conversations with chatbot

/* ***** firebase **** */

const openai = new OpenAIApi(configuration);

const chatbotConversation = document.getElementById("chatbot-conversation");

// A single source of truth. Everything we ask of the ai and everything
// it responds with is stored in this array
const instructionObj = {
  role: "system", // this tells the ai that an instruction follows
  // this is the instruction to the ai & not part of the conversation
  // you can set the 'personality' of the ai with this
  content: "You are a helpful assistant giving very short answers",
};

document.addEventListener("submit", (e) => {
  e.preventDefault();

  const userInput = document.getElementById("user-input");

  // **** firebase **** \\
  // add an object holding the user's input to the conversation DB
  // the firebase `push()` method NOT JS `push()` method
  push(conversationInDb, {
    role: "user",
    content: userInput.value,
  });

  // // **** Pre firebase **** \\
  // // add an object holding the user's input to the conversation array
  // conversationArr.push({
  //   role: "user",
  //   content: userInput.value,
  // });

  fetchReply();

  const newSpeechBubble = document.createElement("div");
  newSpeechBubble.classList.add("speech", "speech-human");
  chatbotConversation.appendChild(newSpeechBubble);
  newSpeechBubble.textContent = userInput.value;
  userInput.value = "";
  chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
});

async function fetchReply() {
  get(conversationInDb).then(async (snapshot) => {
    // chceck the DataSnapshot exists
    if (snapshot) {
      const conversationArr = Object.values(snapshot.val());
      // add the `instructionObj` to the `conversation` array each time it is sent to the DB
      conversationArr.unshift(instructionObj);

      console.log(conversationArr);

      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: conversationArr,
        presence_penalty: 0,
        frequency_penalty: 0.3,
      });
      console.log(response);

      // some vars to hold references to the message object & message content returned by the model
      const msgObj = response.data.choices[0].message; // the response object
      const msgContent = response.data.choices[0].message.content; // the response object content

      console.log(msgObj);
      console.log(msgContent);

      // push the response object the DB using the firebase `push()` method
      push(conversationInDb, msgObj);
      // write to the GUI
      renderTypewriterText(msgContent);
    } else {
      console.log("no snapshot, no data :-'\\");
    }
  });
}

// // **** pre-firebase install **** \\
// async function fetchReply() {
//   const response = await openai.createChatCompletion({
//     model: "gpt-3.5-turbo",
//     messages: conversationArr,
//     // Advice: keep vals between 1 & -1 freq_pen best set at 0.3
//     presence_penalty: 0, // vals between 2.0 & -2.0 increments 0.01 higher vals increase the likelihood of the ai talking about new topics
//     frequency_penalty: 0.3, // vals between 2.0 & -2.0 higher vals decrease the likelihood of the ai repeating the exact same phrases
//   });

//   console.log(response);

//   const answer = response.data.choices[0].message.content;
//   const msgObj = response.data.choices[0].message;

//   renderTypewriterText(answer);
//   conversationArr.push(msgObj);
//   console.log(conversationArr);
// }
// // **** pre-firebase install **** \\

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

// get any existing conversation from the DB when the app starts
async function renderConversationFromDb() {
  // get the whole conversation from the DB using firebassse's `get()` method
  get(conversationInDb).then(async (snapshot) => {
    if (snapshot.exists()) {
      // console.log(snapshot);

      // // store a reference to the array of objects returned in `snapshot`
      const dbArr = Object.values(snapshot.val());
      // // console.log(dbArr);
      // // iterate over the array and create a new speech bubble
      dbArr.forEach((obj) => {
        const newSpeechBubble = document.createElement("div");
        //
        newSpeechBubble.classList.add(
          "speech",
          `speech-${obj.role === "user" ? "human" : "ai"}`
        );
        chatbotConversation.appendChild(newSpeechBubble);
        newSpeechBubble.innerText = obj.content;
      });

      // scroll down to the last speech bubble
      chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
    } else {
      console.log("No snapshot no data, no update interface");
    }
  });
}

renderConversationFromDb();
