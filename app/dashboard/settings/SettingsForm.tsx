"use client";

import { useActionState, useEffect } from "react";
import { saveWhatsappSettings } from "@/app/dashboard/settings/actions";
import { useToast } from "@/components/ui/Toast";

type SettingsState = { ok: boolean; message: string };
const initialState: SettingsState = { ok: false, message: "" };

export function WhatsappSettingsForm({
  businessId,
  initialForwardingNumber,
  connectionStatus,
}: {
  businessId: string;
  initialForwardingNumber: string;
  connectionStatus: string;
}) {
  const showToast = useToast();
  const [state, formAction, pending] = useActionState(async (_previousState: SettingsState, formData: FormData) => {
    try {
      await saveWhatsappSettings(formData);
      return { ok: true, message: "WhatsApp settings saved." };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to save WhatsApp settings.",
      };
    }
  }, initialState);

  useEffect(() => {
    if (!state.message) {
      return;
    }

    showToast(state.message);
  }, [showToast, state.message]);

  return (
    <form action={formAction}>
      <input type="hidden" name="business_id" value={businessId} />
      <div className="form-field">
        <label htmlFor="forwarding_number">Forwarding number</label>
        <input
          id="forwarding_number"
          name="forwarding_number"
          defaultValue={initialForwardingNumber}
          placeholder="+923001234567"
        />
      </div>
      {state.message ? (
        <p className={`form-status ${state.ok ? "success" : "error"}`} role={state.ok ? "status" : "alert"}>
          {state.message}
        </p>
      ) : null}
      <button type="submit" className="btn solid" disabled={pending}>
        {pending ? "Saving…" : "Save WhatsApp settings"}
      </button>
    </form>
  );
}
