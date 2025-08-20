"use client";

import { Modal } from "@/components/ui/modal";
import type { User } from "@supabase/supabase-js";
import HorseBuyForm from "./HorseBuyForm";

interface HorseBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  horseBuy?: any;
  mode?: 'create' | 'edit';
}

export default function HorseBuyModal({ isOpen, onClose, user, horseBuy, mode = 'create' }: HorseBuyModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Rediger ønskes kjøpt' : 'Opprett ønskes kjøpt'} maxWidth="lg">
      <HorseBuyForm user={user} onSuccess={onClose} horseBuy={horseBuy} mode={mode} />
    </Modal>
  );
}
