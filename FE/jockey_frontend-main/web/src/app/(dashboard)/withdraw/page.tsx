import { WithdrawalForm } from '@web/features/account/components/withdrawal-form';
import { profile } from '@/mocks/data';

export default function WithdrawPage() {
  return <WithdrawalForm balance={profile.balance} />;
}
