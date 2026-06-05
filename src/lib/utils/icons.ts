import { 
  Heart, 
  Wind, 
  Brain, 
  Droplets, 
  Zap, 
  Flame, 
  AlertTriangle, 
  Baby, 
  User, 
  Eye, 
  AlertCircle, 
  Sun 
} from 'lucide-react';

export const CATEGORY_ICONS: Record<string, React.ElementType> = {
  cardiac: Heart,
  respiratory: Wind,
  neurological: Brain,
  trauma: Zap,
  burns: Flame,
  environmental: Sun,
  poisoning: AlertTriangle,
  obstetric: Baby,
  paediatric: User,
  "eye/ent": Eye,
  diabetic: Droplets,
  allergic: AlertCircle,
  // Fallbacks
  gastrointestinal: AlertTriangle,
  other: AlertTriangle
};
