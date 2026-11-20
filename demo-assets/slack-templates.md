# Slack message templates

## (a) Approval request — #ap-approvals
Payment approval needed: Invoice *{invoice}* — {vendor} — ${amount}. Match check passed. Payment request prepared in ProcureDesk. Reply `APPROVE {invoice}` or `REJECT {invoice} <reason>`.

## (b) Exception report — #ap-exceptions
Exception: Invoice *{invoice}* — {vendor} — ${amount}. Reason: {reason}. Flagged in ProcureDesk.

## (c) Missing PO question — requester DM/channel
Invoice *{invoice}* from {vendor} has no PO reference. Which PO should we use (Plant 1 vs Plant 2)? Please confirm; we will not guess.

## (d) End-of-run summary
| Invoice | Vendor | Amount | Result | Action taken | Who must approve |
| --- | --- | --- | --- | --- | --- |
| ... | ... | ... | ... | ... | ... |

### Approver reply protocol
- `APPROVE <invoice number>`
- `REJECT <invoice number> <reason>`
