import { describe, expect, it } from "vitest"
import { searchHref } from "./search-url"

describe("searchHref", () => {
  it("returns root when empty", () => {
    expect(searchHref({})).toBe("/")
  })

  it("keeps filters and the selected job", () => {
    expect(
      searchHref({
        q: "support",
        state: "WA",
        work: "casual",
        job: "disability-support-worker",
      })
    ).toBe("/?q=support&state=WA&work=casual&job=disability-support-worker")
  })

  it("omits page 1", () => {
    expect(searchHref({ page: 1, q: "sil" })).toBe("/?q=sil")
    expect(searchHref({ page: 2, q: "sil" })).toBe("/?q=sil&page=2")
  })
})
