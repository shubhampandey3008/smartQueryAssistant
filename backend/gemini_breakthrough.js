import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-pro",
  apiKey: "AIzaSyAxrAMx5Hxj1zVz6EO3IiOA-xktiEi5hzs",
  maxOutputTokens: 2048,
});
const response = await model.invoke(new HumanMessage("Hello world!"));
