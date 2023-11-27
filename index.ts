import express, { Request, Response } from "express";
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { connectDB } from "./db/db";
import mongoose from "mongoose";
import User from "./models/user.model";

dotenv.config();

connectDB(process.env.MONGO_URI || "");

const token = process.env.TOKEN || "";

const bot = new TelegramBot(token, { polling: true });

// Store conversation states for each user
interface UserAnswers {
  [key: string]: string;
}

const conversationState = new Map<number, string>(); // Assuming `number` as user IDs
const userAnswers = new Map<number, UserAnswers>();

const quizQuestions = [
  "Who is the king of Gondor?",
  "How many people in the fellowship of the ring?",
  "What is Sauron's tower called?",
];

// Listen for '/start' command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // Set initial state
  conversationState.set(chatId, "awaitingName");

  await bot.sendMessage(chatId, "Hello, what is your name?", {
    reply_markup: {
      force_reply: true,
    },
  });
});

// Listen for replies to the initial question
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const currentState = conversationState.get(chatId);

  if (currentState === "awaitingName") {
    // Process the user's name
    await bot.sendMessage(chatId, `Welcome, ${msg.text}`);
    await bot.sendMessage(chatId, "Are you ready to start your quiz?", {
      reply_markup: {
        keyboard: [[{ text: "Yes" }, { text: "No" }]],
      },
    });

    // Move to the next state
    conversationState.set(chatId, "awaitingQuizResponse");
  } else if (currentState === "awaitingQuizResponse") {
    // Process the user's response to the quiz
    if (msg.text === "Yes") {
      conversationState.set(chatId, "awaitingAnswers");
      await bot.sendMessage(chatId, "Great!");
    }
  } else if (currentState === "awaitingAnswers") {
    console.log(userAnswers);
    let currentAnswers = userAnswers.get(chatId);

    if (!currentAnswers) {
      currentAnswers = {};
      userAnswers.set(chatId, currentAnswers);
    }

    const currentAnswersLength = Object.keys(currentAnswers).length;

    if (currentAnswersLength < quizQuestions.length) {
      await bot.sendMessage(chatId, quizQuestions[currentAnswersLength]);
      currentAnswers[quizQuestions[currentAnswersLength]] = String(msg.text);
    }
  }
});

// else if (currentState === "awaitingFirstAnswer") {
//   if (msg.text === "Aragorn") {
//     conversationState.set(chatId, "awaitingSecondAnswer");
//     await bot.sendMessage(
//       chatId,
//       "How many people in the fellowship of the Ring?"
//     );
//   }
// } else if (currentState === "awaitingSecondAnswer") {
//   if (msg.text === "9") {
//     conversationState.set(chatId, "awaitingThirdAnswer");
//     await bot.sendMessage(chatId, "What is the Sauron's tower called?");
//   }
// } else if (currentState == "awaitingThirdAnswer") {
//   if (msg.text === "Barad-dur") {
//     conversationState.set(chatId, "quizDone");
//     await bot.sendMessage(chatId, "Congratz! You won!");
//   }
// }