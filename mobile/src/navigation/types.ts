import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Stack dentro del tab Chat
export type ChatStackParamList = {
  ConversationsList: undefined;
  Chat: { conversationId: string; title?: string };
};

export type AppTabsParamList = {
  ChatStack: undefined;
  Dashboard: undefined;
  Profile: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type ChatStackScreenProps<T extends keyof ChatStackParamList> =
  NativeStackScreenProps<ChatStackParamList, T>;

export type AppTabsScreenProps<T extends keyof AppTabsParamList> =
  BottomTabScreenProps<AppTabsParamList, T>;
