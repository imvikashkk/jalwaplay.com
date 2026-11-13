import { redirect } from 'next/navigation';

// OTP login has been removed — login is now direct with the mobile number.
export default function page() {
  redirect('/auth');
}
