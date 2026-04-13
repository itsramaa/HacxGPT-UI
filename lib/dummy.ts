export const isDummyMode = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === "true";

export const dummyUser = {
  id: "dummy-user-id",
  email: "hacker@hacxgpt.io",
  username: "hacker",
  type: "regular",
  accessToken: "dummy-token",
  availableTokens: 999999
};

export const dummyChats = [
  {
    id: "dummy-chat-1",
    title: "Deep Sea Exploration",
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    userId: "dummy-user-id",
    visibility: "private" as const,
  },
  {
    id: "dummy-chat-2",
    title: "Quantum Computing Basics",
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    userId: "dummy-user-id",
    visibility: "private" as const,
  },
];

export const dummyMessages = {
  "dummy-chat-1": [
    {
      id: "m1",
      role: "user",
      content: "Tell me about deep sea exploration.",
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: "m2",
      role: "assistant",
      content: "Deep sea exploration is the investigation of physical, chemical, and biological conditions on the sea bed, for scientific or commercial purposes.",
      createdAt: new Date(Date.now() - 3590000),
    }
  ]
};

export const dummyProviders = [
  { id: "openai", name: "OpenAI" },
  { id: "anthropic", name: "Anthropic" },
  { id: "google", name: "Google" },
  { id: "mistral", name: "Mistral" }
];

export const dummyModels = [
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "openai" },
  { id: "anthropic/claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "anthropic" },
  { id: "google/gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "google" }
];
