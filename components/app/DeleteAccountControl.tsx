"use client";

import { useActionState, useState } from "react";
import { deleteAccount, type DeleteAccountState } from "@/app/actions/account";
import { Modal } from "@/components/ui/Modal";

const initialState: DeleteAccountState = { error: "" };

export function DeleteAccountControl({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(deleteAccount, initialState);

  function close() {
    if (!pending) {
      setOpen(false);
    }
  }

  return (
    <>
      <button className="side-link account-danger" type="button" onClick={() => setOpen(true)}>
        <span className="ic" aria-hidden="true">×</span>
        <span className="lbl">Delete account</span>
      </button>
      <Modal open={open} title="Delete your Munshi account?" onClose={close}>
        <form action={formAction}>
          <input type="hidden" name="business_id" value={businessId} />
          <p>This permanently deletes your account and cannot be undone.</p>
          <div className="form-field">
            <label htmlFor="delete-account-password">Current password</label>
            <input id="delete-account-password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {state.error ? <p className="auth-error" role="alert">{state.error}</p> : null}
          <div className="modal-footer">
            <button className="btn" type="button" onClick={close} disabled={pending}>Cancel</button>
            <button className="btn danger" type="submit" disabled={pending}>{pending ? "Deleting…" : "Delete account"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
