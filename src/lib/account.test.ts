import { describe, expect, it } from "vitest"
import { accountKindFromNext, isCompleteApplicantProfile } from "./account-kind"

describe("accountKindFromNext", () => {
  it("treats job-board paths as applicant", () => {
    expect(accountKindFromNext("/")).toBe("applicant")
    expect(accountKindFromNext("/jobs/some-slug")).toBe("applicant")
    expect(accountKindFromNext("/profile?next=/jobs/x")).toBe("applicant")
    expect(accountKindFromNext("/applications")).toBe("applicant")
    expect(accountKindFromNext("/alerts")).toBe("applicant")
  })

  it("treats hiring paths as provider", () => {
    expect(accountKindFromNext("/providers")).toBe("provider")
    expect(accountKindFromNext("/providers/register")).toBe("provider")
    expect(accountKindFromNext("/dashboard")).toBe("provider")
    expect(accountKindFromNext("/dashboard/jobs/1")).toBe("provider")
    expect(accountKindFromNext("/billing")).toBe("provider")
    expect(accountKindFromNext("/jobs/new")).toBe("provider")
  })
})

describe("isCompleteApplicantProfile", () => {
  it("requires name and postcode", () => {
    expect(isCompleteApplicantProfile(null)).toBe(false)
    expect(isCompleteApplicantProfile({ full_name: "Ada", postcode: "" })).toBe(false)
    expect(isCompleteApplicantProfile({ full_name: "Ada", postcode: "6163" })).toBe(true)
  })
})
