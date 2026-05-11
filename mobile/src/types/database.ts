export type SubscriptionTier = 'free' | 'premium';
export type AssetType = 'stock' | 'crypto' | 'etf' | 'bond' | 'cedear';
export type MessageRole = 'user' | 'assistant';
export type AlertCondition = 'above' | 'below';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  asset_type: AssetType;
  currency: string;
  exchange: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  tokens_used: number | null;
  created_at: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  currency: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  items?: PortfolioItem[];
}

export interface PortfolioItem {
  id: string;
  portfolio_id: string;
  user_id: string;
  asset_id: string;
  quantity: number;
  average_price: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  asset?: Asset;
}

export interface PriceAlert {
  id: string;
  user_id: string;
  asset_id: string;
  condition: AlertCondition;
  target_price: number;
  is_active: boolean;
  triggered_at: string | null;
  notified_at: string | null;
  created_at: string;
  updated_at: string;
  asset?: Asset;
}

// Tipos de Supabase Database para type-safety total
export interface Database {
  public: {
    Tables: {
      users: { Row: UserProfile; Insert: Partial<UserProfile>; Update: Partial<UserProfile> };
      assets: { Row: Asset; Insert: Partial<Asset>; Update: Partial<Asset> };
      conversations: { Row: Conversation; Insert: Partial<Conversation>; Update: Partial<Conversation> };
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> };
      portfolios: { Row: Portfolio; Insert: Partial<Portfolio>; Update: Partial<Portfolio> };
      portfolio_items: { Row: PortfolioItem; Insert: Partial<PortfolioItem>; Update: Partial<PortfolioItem> };
      price_alerts: { Row: PriceAlert; Insert: Partial<PriceAlert>; Update: Partial<PriceAlert> };
    };
  };
}
