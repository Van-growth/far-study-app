import TBSTab from '../components/TBSTab';

export default function TBSPage() {
  return (
    <div className="flex flex-col h-full" style={{ background: '#f0f4f8' }}>
      <div
        className="flex-1 overflow-hidden mx-auto w-full"
        style={{ maxWidth: 720, background: '#f0f4f8' }}
      >
        <TBSTab />
      </div>
    </div>
  );
}
