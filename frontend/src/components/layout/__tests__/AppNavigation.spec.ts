import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createRouter, createWebHistory } from "vue-router";
import AppNavigation from "../AppNavigation.vue";
import { useAuthStore } from "../../../stores/auth";

// Mock the auth store
vi.mock("../../../stores/auth", () => ({
  useAuthStore: vi.fn(() => ({
    user: { name: "Test User", email: "test@example.com" },
    accessToken: "mock-access-token",
    logout: vi.fn(),
  })),
}));

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: { template: "<div>Home</div>" } },
    { path: "/dashboard", component: { template: "<div>Dashboard</div>" } },
    { path: "/transactions", component: { template: "<div>Transactions</div>" } },
  ],
});

describe("AppNavigation", () => {
  it("renders navigation links correctly", async () => {
    const wrapper = mount(AppNavigation, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain("ダッシュボード");
    expect(wrapper.text()).toContain("取引管理");
    expect(wrapper.text()).toContain("予算管理");
    expect(wrapper.text()).toContain("グループ");
  });

  it("displays user name", () => {
    const wrapper = mount(AppNavigation, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain("Test User");
  });

  it("shows user initials in avatar", () => {
    const wrapper = mount(AppNavigation, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain("TU"); // Test User initials
  });
});
