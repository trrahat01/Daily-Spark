export interface Quote {
  id: string;
  text: string;
  author: string;
  category: string;
  image_url?: string | null;
  created_at: string;
}

export interface Admin {
  id: string;
  email: string;
  pin: string;
}

export interface AdSettings {
  id: string;
  banner_enabled: boolean;
  interstitial_enabled: boolean;
}

export interface Category {
  id: string;
  name: string;
}
