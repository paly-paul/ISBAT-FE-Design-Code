# Notification Bell

**Route:** none — a global component in the app shell, visible on every authenticated page
**Module:** Shared (served by erp-userrole-service, Notifications module)

## Purpose
The bell icon in the top bar. Shows a badge with the number of unread notifications, opens a dropdown listing the most recent ones, and navigates to the relevant record when one is clicked. Updates live, so a user sitting on any page sees a new enquiry appear without refreshing.

Today the only notification is **a new enquiry**, delivered to everyone holding the Enquiry Follow-up page permission. More types are added server-side without any frontend change, as long as the click behaviour below is driven by `pageUrl` + `entityGuid` rather than hardcoded per type.

---

## Flow

### 1. On login / app shell mount

Two calls, **in this order**:

1. `GET /api/v1/notifications/unread-count` → render the badge.
2. Open the SignalR connection to `/hubs/notifications`.

**Order matters.** The count call is what accounts for everything that happened while the user was logged out — the hub only delivers what arrives from now on and can never replay the past. Opening the socket first and skipping the count leaves the badge at 0 for a user with 12 unread notifications.

Do **not** fetch the list here. The dropdown is closed; only the number is needed.

### 2. While the app is open (idle)

Nothing is polled. The badge changes only when the server pushes.

On a `notification` event:
- prepend the object to the in-memory list
- increment the badge by 1
- optionally animate the bell

The pushed object is identical in shape to a list item, so the same component renders it.

### 3. On bell click (dropdown opens)

Call `GET /api/v1/notifications?page=1&size=20`.

**Fetch every time the dropdown opens — do not render from the in-memory list alone.** That list only holds what arrived over the socket during this page session; a refresh empties it, and a dropped connection leaves gaps. The endpoint is the authoritative view.

Use the returned `totalCount` for "showing 20 of N" and to decide whether to offer a "load more" (`page=2`).

### 3a. On search

Pass `search` to the same list endpoint: `GET /api/v1/notifications?page=1&size=20&search=peter`.

Search is **server-side**, not a filter over what is already loaded — the dropdown only holds one page, so filtering client-side would miss older matches. Always reset to `page=1` when the term changes, and debounce roughly 300 ms so a request is not sent per keystroke.

Combine freely with `unreadOnly`; the two are ANDed. `totalCount` reflects the filtered set, so paging works normally while a search is active.

The badge is **not** affected — it always shows total unread, never the filtered count.

### 4. On item click

1. `POST /api/v1/notifications/{notificationGuid}/read`
2. The response `data` is the **remaining unread count** — set the badge from it directly. Do not call `unread-count` again.
3. Navigate using `pageUrl` and `entityGuid`:

```ts
router.navigate([n.pageUrl], { queryParams: { enquiry: n.entityGuid } });
```

4. Close the dropdown.

If the read call returns 404, the notification was already read (or a double-click raced) — proceed with navigation anyway and leave the badge as-is. It is not an error worth showing the user.

### 5. On "Mark all as read"

`POST /api/v1/notifications/read-all`, then set the badge to `0` and flip every loaded item's `isRead` locally. The response returns how many rows changed; `0` is a normal outcome.

### 6. On reconnect

`withAutomaticReconnect()` handles the socket. In the `onreconnected` callback:
- refetch `unread-count`
- refetch page 1 if the dropdown is currently open

**This is not optional.** Notifications pushed during the outage are gone from the socket's perspective; refetching is the only thing that heals the badge.

### 7. On logout

Call `connection.stop()`. A stale connection keeps receiving pushes for the previous user until the cookie expires.

---

## API call timing — summary

| Moment | API | Why then |
|---|---|---|
| Login / shell mount | [unread-count](../../api/userrole-service/notifications/get-notifications-unread-count.md) | Only source for what was missed while logged out |
| Login, after the count | [hub connect](../../api/userrole-service/notifications/ws-notifications-hub.md) | Live updates from now on |
| Push received | *(none)* | Update local state only — the payload is complete |
| Bell clicked | [list](../../api/userrole-service/notifications/get-notifications.md) | Socket memory is incomplete after a refresh or a drop |
| Search term changed (debounced) | [list](../../api/userrole-service/notifications/get-notifications.md) `search=…&page=1` | Server-side — the client only holds one page |
| "Load more" | [list](../../api/userrole-service/notifications/get-notifications.md) `page=2` | Carry the current `search` and `unreadOnly` forward |
| Item clicked | [mark-read](../../api/userrole-service/notifications/post-notification-read.md) | Returns the new badge value — no second call needed |
| "Mark all as read" | [mark-all-read](../../api/userrole-service/notifications/post-notifications-read-all.md) | Badge becomes 0 |
| Reconnected | [unread-count](../../api/userrole-service/notifications/get-notifications-unread-count.md) | Heals whatever was missed during the outage |
| Logout | *(none)* | `connection.stop()` |

**Never polled.** If the socket is healthy the badge is live; if it drops, reconnect handles it. Polling `unread-count` on a timer is only a fallback if the hub cannot be used at all.

---

## Business logic notes

**You never receive notifications for your own actions.** The user who creates an enquiry is excluded from the resulting notification. Testing with a single account looks like a broken feature — use two accounts.

**Audience is permission-based, not role-based.** A notification type targets a permission key (`admission.enquiryfollowup.get` for new enquiries). Users are resolved at delivery time, so granting someone that permission means they start receiving notifications immediately, with no redeploy. It also means a user can connect successfully and legitimately receive nothing.

**`pageUrl` may be null.** It is configured per notification type server-side. Keep a client-side fallback keyed on `entityType` so an unconfigured type still navigates somewhere sensible rather than crashing.

**Do not hardcode per-type behaviour.** New notification types are added server-side as data. If click handling is driven by `pageUrl` + `entityGuid`, new types work with no frontend release. Branch on `typeCode` only for cosmetics such as an icon.

**The target page must stand alone.** It will be opened cold from a deep link with no in-memory state, and must re-check permission on load. A notification is a hint, never an authorization.

**`createdDate` is UTC** with a trailing `Z`. Parse and render in local time; do not display it raw.

**Titles are historical.** `title` and `body` are rendered when the notification is written, so an old notification keeps its original wording even if the server-side template later changes. Do not attempt to re-render them client-side.

---

## APIs used

| Step | API | API ID | Notes |
|---|---|---|---|
| Badge on load / reconnect | [GET /api/v1/notifications/unread-count](../../api/userrole-service/notifications/get-notifications-unread-count.md) | `userrole-service.notifications.unread-count` | Integer payload |
| Live updates | [WS /hubs/notifications](../../api/userrole-service/notifications/ws-notifications-hub.md) | `userrole-service.notifications.hub` | Method name `notification` |
| Dropdown contents | [GET /api/v1/notifications](../../api/userrole-service/notifications/get-notifications.md) | `userrole-service.notifications.list` | `size` clamped to 100 |
| Item click | [POST /api/v1/notifications/{guid}/read](../../api/userrole-service/notifications/post-notification-read.md) | `userrole-service.notifications.mark-read` | Returns remaining unread count |
| Mark all | [POST /api/v1/notifications/read-all](../../api/userrole-service/notifications/post-notifications-read-all.md) | `userrole-service.notifications.mark-all-read` | Returns rows affected |

---

## Related pages
- Enquiry Follow-up (`enquiry-followup`) — the page a new-enquiry notification navigates to. No page doc yet; link it here when one is written.

## Changelog

| Date | Changed by | Change |
|---|---|---|
| 2026-08-19 | Vaishnav | Initial version created |
