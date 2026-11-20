# `data/exports/` — measured data, nothing else

Drop a Search Console Performance CSV here (`Query,Clicks,Impressions,Position`) and run
`npm run topics`. The topic tool ranks candidates from it and refuses to rank anything without it.

Also acceptable: an Associates Central report export, since the campaign ledger may only be filled
from those. Name files with the date they cover, e.g. `gsc-queries-2026-12-04.csv`, so any number
in the ledger can be traced back to a file.

Not acceptable: third-party volume estimates, competitor dashboards, or any figure you would not
want read aloud during an account review.
