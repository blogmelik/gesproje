<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application rules
- Keep committed quantities and pending quantity edits in the shared React provider above the outlet; explicit save commits pending edits to overview data, and both remain in memory without persistence.
- Keep Dashboard at `/` and drill-down entry at `/rapor-yaz`, with the branded header and collapsible desktop/mobile sidebar in the root shell so workflows remain separate.
- Reuse field hierarchy constants and progress components across both pages so targets and completion calculations stay consistent.
- Keep fault records in a dedicated browser-storage hook keyed by table and item; persist photos as resized data URLs and read storage only after hydration so offline reports survive reload without changing demo quantity storage.
- Revizyon Yönetimi lives at `/revizyon` and reads fault records through the shared fault storage hook; Excel exports load `xlsx` dynamically on click so it stays out of the initial bundle.
- Team names live in a separate browser-storage hook that syncs all open instances through a window event; renaming a team also updates saved fault records so history stays consistent.
- Keep project and company settings in a dedicated React provider above the shell and outlet, reading browser storage after hydration; `/ayarlar` edits the shared state live so the header stays synchronized independently of demo quantities.
- Apply dark mode to the document root as well as the shell so portaled controls share the active semantic theme.
- Keep menu appearance in a dedicated hydration-safe browser-storage React provider above the shell and outlet; render the same navigation items for sidebar or fixed bottom layout and reserve safe-area-aware content clearance for the bottom bar.
- UI text uses Turkish source strings translated through the shared language provider (`useI18n().t`) with a browser-stored language choice; stored data stays in Turkish so records remain consistent across languages.
- Desktop (lg+) layouts are additive: the İlerleme split-pane tree/spreadsheet and the Overview chart render only at lg, while the mobile drill-down stays untouched below lg so phone UX never regresses.
