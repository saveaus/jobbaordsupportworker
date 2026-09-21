# Data

`postcodes.csv` is trimmed from the public Australian postcodes dataset at
[matthewproctor/australianpostcodes](https://github.com/matthewproctor/australianpostcodes)
(free to use with attribution). Columns: postcode, suburb, state, lat, lng.
Rows without coordinates were dropped. Regenerate by re-running the trim in
`scripts/seed.ts` docs if the source updates.
