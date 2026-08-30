import { useNavigate } from 'react-router-dom';
import HelpCenter from '../components/HelpCenter';

export default function HelpPage() {
  const navigate = useNavigate();
  return <HelpCenter onClose={() => navigate('/')} />;
}
