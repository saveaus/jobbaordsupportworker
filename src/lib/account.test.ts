import { describe, expect, it } from "vitest"
import {
  accountKindFromNext,
  choosePath,
  createAccountPath,
  isCompleteApplicantProfile,
  parseAccountKind,
  safeNext,
  signInPath,
} from "./account-kind"

describe("parseAccountKind", () => {
  it("defaults to applicant", () => {
    expect(parseAccountKind(undefined)).toBe("applicant")
    expect(parseAccountKind("provider")).toBe("provider")
  })
})

describe("auth paths", () => {
  it("keeps sign-in and create-account on one pair of routes", () => {
    expect(signInPath()).toBe("/sign-in")
    expect(signInPath("/jobs/x")).toBe("/sign-in?next=%2Fjobs%2Fx")
    expect(createAccountPath()).toBe("/create-account")
    expect(createAccountPath("/jobs/x")).toBe("/create-account?next=%2Fjobs%2Fx")
  })

  it("sends new accounts to choose apply or hire", () => {
    expect(choosePath()).toBe("/get-started")
    expect(choosePath("/jobs/x")).toBe("/get-started?next=%2Fjobs%2Fx")
    expect(choosePath("/providers/register")).toBe(
      "/get-started?next=%2Fproviders%2Fregister&intent=hire"
    )
  })

  it("rejects unsafe next values", () => {
    expect(safeNext("https://evil.test")).toBe("/")
    expect(safeNext("//evil.test")).toBe("/")
    expect(safeNext("/profile")).toBe("/profile")
  })
})

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
