import { Boxes } from 'lucide-react';
import { ComingSoon } from './ComingSoon';

export default function MastersPage() {
  return (
    <ComingSoon
      icon={Boxes}
      title="Masters"
      description="Categories, brands, units and other master records."
      note="Master data like categories, brands and units will be managed here in a later phase."
    />
  );
}
