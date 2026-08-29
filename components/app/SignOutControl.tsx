"use client";

import { useState } from "react";
import { signOut } from "@/app/actions/auth";
import { Modal } from "@/components/ui/Modal";

export function SignOutControl() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="side-link" type="button" onClick={() => setOpen(true)}>
        <span className="ic" aria-hidden="true">↪</span>
        <span className="lbl">Sign out</span>
      </button>
      <Modal
        open={open}
        title="Sign out of Munshi?"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn" type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <form action={signOut}>
              <button className="btn solid" type="submit">OK</button>
            </form>
          </>
        }
      >
        <p>You'll need to sign in again to access this workspace.</p>
      </Modal>
    </>
  );
}
