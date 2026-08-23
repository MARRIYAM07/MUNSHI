import {describe,expect,it} from "vitest";
import {decodeMessage,parseProviderEmail,providerForSender} from "./gmail";

describe("providerForSender",()=>{
  it("resolves a bare email address",()=>{
    expect(providerForSender("payments@wise.com")).toBe("wise");
  });

  it("resolves a display name and angle-bracket address",()=>{
    expect(providerForSender("Payoneer Alerts <notify@payoneer.com>")).toBe("payoneer");
  });

  it("returns null for an unconfigured sender domain",()=>{
    expect(providerForSender("alerts@example.com")).toBeNull();
  });

  it("matches configured sender subdomains",()=>{
    expect(providerForSender("jobs@notifications.upwork.com")).toBe("upwork");
  });
});

describe("parseProviderEmail",()=>{
  it.each([
    "From: Acme Client\nTransaction ID: tx-123",
    "USD 42.50\nFrom: Acme Client",
  ])("returns null without both an amount and transaction id",body=>{
    expect(parseProviderEmail("payoneer",body)).toBeNull();
  });
});

describe("decodeMessage",()=>{
  it("strips HTML and decodes entities in a nested multipart payload",()=>{
    const html=Buffer.from("<div>Payment&nbsp;<strong>received</strong></div>").toString("base64url");
    const decoded=decodeMessage({parts:[{mimeType:"multipart/alternative",parts:[{mimeType:"text/html",body:{data:html}}]}]});

    expect(decoded).not.toMatch(/<[^>]+>/);
    expect(decoded).not.toContain("&nbsp;");
    expect(decoded.replace(/\s+/g," ").trim()).toBe("Payment received");
  });
});
