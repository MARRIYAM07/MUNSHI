import {describe,expect,it} from "vitest";
import {detectSmsProvider,parseSms} from "./sms";

describe("detectSmsProvider",()=>{
  it("falls back to bank_sms for an unknown sender and body",()=>{
    expect(detectSmsProvider("HBL Alerts","Your account has been updated")).toBe("bank_sms");
  });
});

describe("parseSms",()=>{
  it("parses a JazzCash received SMS as credit",()=>{
    expect(parseSms("JazzCash","Rs. 1,250 received from Ali Khan.")).toMatchObject({provider:"jazzcash",amountMinor:125000,direction:"credit",counterparty:"Ali Khan"});
  });

  it.each(["sent","paid"])("parses a JazzCash %s SMS as debit",verb=>{
    expect(parseSms("Mobilink",`${verb} Rs. 500 to Sara Ahmed.`)).toMatchObject({provider:"jazzcash",amountMinor:50000,direction:"debit",counterparty:"Sara Ahmed"});
  });

  it("parses an Easypaisa received SMS as credit",()=>{
    expect(parseSms("Easypaisa","Received PKR 750 from Hamza Malik.")).toMatchObject({provider:"easypaisa",amountMinor:75000,direction:"credit",counterparty:"Hamza Malik"});
  });

  it.each(["sent","paid"])("parses an Easypaisa %s SMS as debit",verb=>{
    expect(parseSms("Telenor",`Rs. 900 ${verb} to Utility Store.`)).toMatchObject({provider:"easypaisa",amountMinor:90000,direction:"debit",counterparty:"Utility Store"});
  });

  it("uses directionGroup for lowercase credited bank messages",()=>{
    expect(parseSms("Bank Alerts","PKR 2,000 credited from Acme Ltd.")).toMatchObject({provider:"bank_sms",amountMinor:200000,direction:"credit"});
  });

  it("parses comma-formatted amounts",()=>{
    expect(parseSms("JazzCash","Rs. 12,500 received from Bilal.")?.amountMinor).toBe(1250000);
  });

  it("returns null when no configured pattern matches",()=>{
    expect(parseSms("JazzCash","Welcome to your mobile wallet")).toBeNull();
  });
});
