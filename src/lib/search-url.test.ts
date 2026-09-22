import { describe, expect, it } from "vitest"
import { parseSearchRadius, searchHref } from "./search-url"

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

  it("omits the default 50 km radius", () => {
    expect(searchHref({ radius: 50, q: "sil" })).toBe("/?q=sil")
    expect(searchHref({ radius: 10, q: "sil" })).toBe("/?q=sil&radius=10")
  })

  it("omits page 1", () => {
    expect(searchHref({ page: 1, q: "sil" })).toBe("/?q=sil")
    expect(searchHref({ page: 2, q: "sil" })).toBe("/?q=sil&page=2")
  })
})

describe("parseSearchRadius", () => {
  it("accepts listed radii and defaults to 50", () => {
    expect(parseSearchRadius("10")).toBe(10)
    expect(parseSearchRadius("100")).toBe(100)
    expect(parseSearchRadius("3")).toBe(50)
    expect(parseSearchRadius(undefined)).toBe(50)
  })
})
