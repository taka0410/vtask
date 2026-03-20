import GuestLayoutClient from './GuestLayoutClient';

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestLayoutClient>{children}</GuestLayoutClient>;
}
