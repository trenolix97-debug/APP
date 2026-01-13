import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  restaurantSuggestions?: Array<{ id: string; name: string; cuisine: string }>;
}

const SUGGESTED_PROMPTS = [
  'Recommend something healthy',
  'Best place for 4 people',
  'Quick lunch options',
  'Italian food nearby',
];

const AI_RESPONSES: { [key: string]: string } = {
  healthy:
    "I recommend Green Bowl! They specialize in fresh salads, grain bowls, and smoothies. Their Quinoa Bowl and Poke Bowl are popular choices.",
  people:
    "For a group of 4, I'd suggest Bella Italia or Sushi Master. Both have spacious seating and great sharing options. Bella Italia has family-style pasta dishes!",
  quick:
    "Burger Junction is your best bet for quick lunch! They're fast, delicious, and offer delivery in 15-25 minutes.",
  italian:
    "Bella Italia is fantastic! They serve authentic Italian cuisine with amazing pasta, pizza, and desserts. Their Spaghetti Carbonara is a must-try!",
  default:
    "I can help you find the perfect restaurant! Try asking about cuisines, dietary preferences, or group sizes. What are you in the mood for?",
};

export default function AIScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! I\'m your AI dining assistant. I can help you find the perfect restaurant or dish. What are you looking for today?',
      isUser: false,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('healthy') || lowerMessage.includes('salad')) {
      return AI_RESPONSES.healthy;
    } else if (lowerMessage.includes('people') || lowerMessage.includes('group')) {
      return AI_RESPONSES.people;
    } else if (lowerMessage.includes('quick') || lowerMessage.includes('fast')) {
      return AI_RESPONSES.quick;
    } else if (lowerMessage.includes('italian') || lowerMessage.includes('pasta')) {
      return AI_RESPONSES.italian;
    }
    return AI_RESPONSES.default;
  };

  const sendMessage = (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Simulate AI typing
    setIsTyping(true);
    setTimeout(() => {
      const aiResponse = getAIResponse(messageText);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageBubble,
        item.isUser ? styles.userBubble : styles.aiBubble,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          item.isUser ? styles.userText : styles.aiText,
        ]}
      >
        {item.text}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {/* Suggested Prompts */}
      {messages.length <= 1 && (
        <View style={styles.promptsContainer}>
          <Text style={styles.promptsTitle}>Try asking:</Text>
          {SUGGESTED_PROMPTS.map((prompt, index) => (
            <TouchableOpacity
              key={index}
              style={styles.promptChip}
              onPress={() => sendMessage(prompt)}
            >
              <Text style={styles.promptText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <View style={[styles.messageBubble, styles.aiBubble]}>
          <Text style={styles.typingText}>AI is typing...</Text>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => sendMessage()}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => sendMessage()}
          disabled={!inputText.trim()}
        >
          <Ionicons
            name="send"
            size={24}
            color={inputText.trim() ? '#FFC107' : '#CCC'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  promptsContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  promptsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  promptChip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  promptText: {
    fontSize: 14,
    color: '#000',
  },
  messagesList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFC107',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#000',
  },
  aiText: {
    color: '#000',
  },
  typingText: {
    fontSize: 15,
    color: '#999',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
  },
});
