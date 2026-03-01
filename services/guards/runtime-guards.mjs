const guardState = {
  perUserCreates: new Map(),
  perIpCreates: new Map()
};

export function resetGuardState() {
  guardState.perUserCreates.clear();
  guardState.perIpCreates.clear();
}

export function enforceServerCaps({ requestedTiles, maxTiles }) {
  if (requestedTiles > maxTiles) {
    return { allowed: false, reason: "tile_cap_exceeded", effectiveTiles: maxTiles };
  }
  return { allowed: true, effectiveTiles: requestedTiles };
}

export function enforceCreateQuota({ userId, ip, maxPerUser, maxPerIp }) {
  const userCount = (guardState.perUserCreates.get(userId) || 0) + 1;
  const ipCount = (guardState.perIpCreates.get(ip) || 0) + 1;
  guardState.perUserCreates.set(userId, userCount);
  guardState.perIpCreates.set(ip, ipCount);

  if (userCount > maxPerUser) {
    return { allowed: false, reason: "user_quota_exceeded", userCount, ipCount };
  }
  if (ipCount > maxPerIp) {
    return { allowed: false, reason: "ip_quota_exceeded", userCount, ipCount };
  }
  return { allowed: true, userCount, ipCount };
}

export function evaluateCircuitBreaker({ errorRate, estimatedEgressGbPerHour, thresholds }) {
  const trigger =
    errorRate >= thresholds.maxErrorRate ||
    estimatedEgressGbPerHour >= thresholds.maxEstimatedEgressGbPerHour;

  if (!trigger) {
    return { triggered: false, forcedProfile: null };
  }
  return {
    triggered: true,
    forcedProfile: "thumb_low",
    reason:
      errorRate >= thresholds.maxErrorRate
        ? "error_rate_threshold"
        : "egress_threshold"
  };
}
