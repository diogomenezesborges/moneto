import {
  // Income
  Banknote,
  HandCoins,
  Wallet,
  PiggyBank,
  TrendingUp,
  CircleDollarSign,

  // Housing
  Home,
  Building,
  Plug,
  Wrench,
  ShieldCheck,
  Key,
  Lightbulb,
  Droplets,
  Flame,
  Wifi,

  // Transport
  Car,
  Fuel,
  Bus,
  Train,
  Bike,
  CarTaxiFront,
  ParkingCircle,
  SquareParking,
  CircleGauge,
  Route,

  // Food
  UtensilsCrossed,
  ShoppingCart,
  Coffee,
  Pizza,
  Soup,
  IceCream,
  Wine,
  Apple,
  Sandwich,
  ChefHat,

  // Health
  HeartPulse,
  Stethoscope,
  Pill,
  Syringe,
  Activity,
  Cross,
  Thermometer,
  Brain,
  Eye,
  Dumbbell,

  // Education
  GraduationCap,
  Book,
  BookOpen,
  Pencil,
  School,
  Library,
  Languages,
  Calculator,
  Presentation,
  Notebook,

  // Leisure
  PartyPopper,
  Gamepad2,
  Music,
  Film,
  Tv,
  Camera,
  Plane,
  MapPin,
  Palmtree,
  Ticket,
  Volleyball,
  Tent,

  // Personal
  User,
  Shirt,
  Scissors,
  Gift,
  Heart,
  Sparkles,
  Watch,
  Glasses,
  Gem,

  // Financial
  CreditCard,
  Landmark,
  Receipt,
  FileText,
  BarChart3,
  LineChart,
  Percent,
  ArrowDownUp,
  BadgeDollarSign,
  Coins,

  // Other/General
  Package,
  Box,
  FolderOpen,
  Tag,
  Star,
  Bookmark,
  Flag,
  CircleHelp,
  MoreHorizontal,
  Grid3X3,

  // Subscriptions
  Play,
  Smartphone,
  Monitor,
  Cloud,
  Headphones,
  Radio,

  // Kids/Family
  Baby,
  Users,
  Dog,
  Cat,
  PawPrint,
  Blocks,

  // Shopping
  ShoppingBag,
  Store,
  Barcode,

  // Communication
  Phone,
  Mail,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react'

// Re-export LucideIcon type for use in other components
export type { LucideIcon }

// Map of icon names to components
export const iconMap: Record<string, LucideIcon> = {
  // Income
  Banknote,
  HandCoins,
  Wallet,
  PiggyBank,
  TrendingUp,
  CircleDollarSign,

  // Housing
  Home,
  Building,
  Plug,
  Wrench,
  ShieldCheck,
  Key,
  Lightbulb,
  Droplets,
  Flame,
  Wifi,

  // Transport
  Car,
  Fuel,
  Bus,
  Train,
  Bike,
  CarTaxiFront,
  ParkingCircle,
  SquareParking,
  CircleGauge,
  Route,

  // Food
  UtensilsCrossed,
  ShoppingCart,
  Coffee,
  Pizza,
  Soup,
  IceCream,
  Wine,
  Apple,
  Sandwich,
  ChefHat,

  // Health
  HeartPulse,
  Stethoscope,
  Pill,
  Syringe,
  Activity,
  Cross,
  Thermometer,
  Brain,
  Eye,
  Dumbbell,

  // Education
  GraduationCap,
  Book,
  BookOpen,
  Pencil,
  School,
  Library,
  Languages,
  Calculator,
  Presentation,
  Notebook,

  // Leisure
  PartyPopper,
  Gamepad2,
  Music,
  Film,
  Tv,
  Camera,
  Plane,
  MapPin,
  Palmtree,
  Ticket,
  Volleyball,
  Tent,

  // Personal
  User,
  Shirt,
  Scissors,
  Gift,
  Heart,
  Sparkles,
  Watch,
  Glasses,
  Gem,

  // Financial
  CreditCard,
  Landmark,
  Receipt,
  FileText,
  BarChart3,
  LineChart,
  Percent,
  ArrowDownUp,
  BadgeDollarSign,
  Coins,

  // Other/General
  Package,
  Box,
  FolderOpen,
  Tag,
  Star,
  Bookmark,
  Flag,
  CircleHelp,
  MoreHorizontal,
  Grid3X3,

  // Subscriptions
  Play,
  Smartphone,
  Monitor,
  Cloud,
  Headphones,
  Radio,

  // Kids/Family
  Baby,
  Users,
  Dog,
  Cat,
  PawPrint,
  Blocks,

  // Shopping
  ShoppingBag,
  Store,
  Barcode,

  // Communication
  Phone,
  Mail,
  MessageCircle,
}

// Curated icon categories for the picker
export const iconCategories = {
  Income: ['Banknote', 'HandCoins', 'Wallet', 'PiggyBank', 'TrendingUp', 'CircleDollarSign'],
  Housing: [
    'Home',
    'Building',
    'Plug',
    'Wrench',
    'ShieldCheck',
    'Key',
    'Lightbulb',
    'Droplets',
    'Flame',
    'Wifi',
  ],
  Transport: [
    'Car',
    'Fuel',
    'Bus',
    'Train',
    'Bike',
    'CarTaxiFront',
    'ParkingCircle',
    'CircleGauge',
    'Route',
  ],
  Food: [
    'UtensilsCrossed',
    'ShoppingCart',
    'Coffee',
    'Pizza',
    'Soup',
    'IceCream',
    'Wine',
    'Apple',
    'Sandwich',
    'ChefHat',
  ],
  Health: [
    'HeartPulse',
    'Stethoscope',
    'Pill',
    'Syringe',
    'Activity',
    'Cross',
    'Thermometer',
    'Brain',
    'Eye',
    'Dumbbell',
  ],
  Education: [
    'GraduationCap',
    'Book',
    'BookOpen',
    'Pencil',
    'School',
    'Library',
    'Languages',
    'Calculator',
    'Presentation',
    'Notebook',
  ],
  Leisure: [
    'PartyPopper',
    'Gamepad2',
    'Music',
    'Film',
    'Tv',
    'Camera',
    'Plane',
    'MapPin',
    'Palmtree',
    'Ticket',
    'Volleyball',
    'Tent',
  ],
  Personal: ['User', 'Shirt', 'Scissors', 'Gift', 'Heart', 'Sparkles', 'Watch', 'Glasses', 'Gem'],
  Financial: [
    'CreditCard',
    'Landmark',
    'Receipt',
    'FileText',
    'BarChart3',
    'LineChart',
    'Percent',
    'ArrowDownUp',
    'BadgeDollarSign',
    'Coins',
  ],
  Subscriptions: ['Play', 'Smartphone', 'Monitor', 'Cloud', 'Headphones', 'Radio'],
  Family: ['Baby', 'Users', 'Dog', 'Cat', 'Blocks'],
  Shopping: ['ShoppingBag', 'Store', 'Barcode'],
  Other: [
    'Package',
    'Box',
    'FolderOpen',
    'Tag',
    'Star',
    'Bookmark',
    'Flag',
    'CircleHelp',
    'MoreHorizontal',
    'Grid3X3',
  ],
}

// Default icon mappings for major categories
export const defaultMajorCategoryIcons: Record<string, string> = {
  // Actual major categories
  Rendimento: 'Banknote',
  'Rendimento Extra': 'HandCoins',
  'Custos Fixos': 'Home',
  'Custos Variáveis': 'ShoppingCart',
  'Custos Variaveis': 'ShoppingCart',
  'Gastos sem culpa': 'PartyPopper',
  'Economia e Investimentos': 'PiggyBank',
  'Não Categorizados': 'CircleHelp',
  'Nao Categorizados': 'CircleHelp',
  'Não categorizado': 'CircleHelp',
  // English alternatives
  Income: 'Banknote',
  'Extra Income': 'HandCoins',
  'Fixed Costs': 'Home',
  'Variable Costs': 'ShoppingCart',
  'Guilt-free Spending': 'PartyPopper',
  'Savings and Investments': 'PiggyBank',
  Uncategorized: 'CircleHelp',
}

// Default icon mappings for subcategories
export const defaultCategoryIcons: Record<string, string> = {
  // Income
  Salário: 'Banknote',
  'Rendimento Extra': 'HandCoins',
  Salary: 'Banknote',
  'Extra Income': 'HandCoins',

  // Housing
  Renda: 'Home',
  Rent: 'Home',
  Utilities: 'Plug',
  Manutenção: 'Wrench',
  Maintenance: 'Wrench',
  'Seguros Casa': 'ShieldCheck',
  'Home Insurance': 'ShieldCheck',
  Água: 'Droplets',
  Water: 'Droplets',
  Luz: 'Lightbulb',
  Electricity: 'Lightbulb',
  Gás: 'Flame',
  Gas: 'Flame',
  Internet: 'Wifi',

  // Transport
  Combustível: 'Fuel',
  Fuel: 'Fuel',
  'Manutenção Auto': 'Wrench',
  'Car Maintenance': 'Wrench',
  'Transportes Públicos': 'Bus',
  'Public Transport': 'Bus',
  'Seguros Auto': 'ShieldCheck',
  'Car Insurance': 'ShieldCheck',
  Portagens: 'Route',
  Tolls: 'Route',
  Estacionamento: 'SquareParking',
  Parking: 'SquareParking',

  // Food
  Supermercado: 'ShoppingCart',
  Groceries: 'ShoppingCart',
  Restaurantes: 'UtensilsCrossed',
  Restaurants: 'UtensilsCrossed',
  Takeaway: 'Pizza',
  Café: 'Coffee',
  Coffee: 'Coffee',

  // Health
  Médico: 'Stethoscope',
  Doctor: 'Stethoscope',
  Farmácia: 'Pill',
  Pharmacy: 'Pill',
  'Seguros Saúde': 'ShieldCheck',
  'Health Insurance': 'ShieldCheck',
  Ginásio: 'Dumbbell',
  Gym: 'Dumbbell',

  // Education
  Escola: 'School',
  School: 'School',
  'Material Escolar': 'Pencil',
  'School Supplies': 'Pencil',
  'Atividades Extra': 'Blocks',
  Extracurricular: 'Blocks',
  Livros: 'Book',
  Books: 'Book',
  Cursos: 'Presentation',
  Courses: 'Presentation',

  // Leisure
  Entretenimento: 'PartyPopper',
  Entertainment: 'PartyPopper',
  Viagens: 'Plane',
  Travel: 'Plane',
  Hobbies: 'Gamepad2',
  Subscrições: 'Play',
  Subscriptions: 'Play',
  Cinema: 'Film',
  Movies: 'Film',
  Música: 'Music',
  Music: 'Music',
  Streaming: 'Tv',

  // Personal
  Roupa: 'Shirt',
  Clothing: 'Shirt',
  'Cuidados Pessoais': 'Sparkles',
  'Personal Care': 'Sparkles',
  Presentes: 'Gift',
  Gifts: 'Gift',
  Cabelo: 'Scissors',
  Haircut: 'Scissors',

  // Financial
  Poupança: 'PiggyBank',
  Savings: 'PiggyBank',
  Investimentos: 'LineChart',
  Investments: 'LineChart',
  Créditos: 'CreditCard',
  Loans: 'CreditCard',
  Impostos: 'Receipt',
  Taxes: 'Receipt',
  'Taxas Bancárias': 'Landmark',
  'Bank Fees': 'Landmark',

  // Other
  Diversos: 'Package',
  Miscellaneous: 'Package',
  'Não Categorizado': 'CircleHelp',
  Uncategorized: 'CircleHelp',

  // Pets
  Animais: 'Dog',
  Pets: 'Dog',

  // Kids
  Crianças: 'Baby',
  Kids: 'Baby',

  // Phone
  Telemóvel: 'Smartphone',
  Phone: 'Smartphone',

  // Cash withdrawal
  Levantamento: 'Wallet',
  Withdrawal: 'Wallet',

  // Motorcycle
  Mota: 'Bike',
  'Mota Combustível': 'Bike',
  'Mota Manutenção': 'Bike',
  'Mota Seguro': 'Bike',
  Motorcycle: 'Bike',

  // Dog/Tafi
  Tafi: 'PawPrint',
  'Tafi Alimentação': 'PawPrint',
  'Tafi Veterinário': 'PawPrint',
  'Tafi Acessórios': 'PawPrint',
}

// Helper function to get icon component by name
export function getIcon(iconName: string): LucideIcon | null {
  return iconMap[iconName] || null
}

// Helper function to get icon for a category (with fallback)
export function getCategoryIcon(categoryName: string): LucideIcon {
  const iconName =
    defaultCategoryIcons[categoryName] || defaultMajorCategoryIcons[categoryName] || 'Package'
  return iconMap[iconName] || iconMap['Package']
}

// Helper function to get icon name for a category
export function getCategoryIconName(categoryName: string): string {
  return defaultCategoryIcons[categoryName] || defaultMajorCategoryIcons[categoryName] || 'Package'
}

// Get all icon names
export function getAllIconNames(): string[] {
  return Object.keys(iconMap)
}
