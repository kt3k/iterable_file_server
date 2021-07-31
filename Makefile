UDD=deno run --allow-read=. --allow-net=cdn.deno.land --allow-write=. https://deno.land/x/udd@0.5.0/main.ts

test:
	deno test -A --unstable

fmt:
	deno fmt

fmt-check:
	deno fmt --check

lint:
	deno lint

update:
	$(UDD) *.ts

.PHONY: test fmt fmt-check lint update
