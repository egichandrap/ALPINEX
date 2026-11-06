package k6

import (
	"fmt"
	"strings"

	"github.com/alpinex/alpinex/internal/core/domain/api"
	"github.com/alpinex/alpinex/internal/core/domain/performance"
)

// GenerateK6Script synthesizes an executable k6 JavaScript script from domain models.
func GenerateK6Script(test *performance.PerformanceTest, requests map[string]*api.APIRequest, resolvedVars map[string]string) string {
	if test.CustomScript != "" {
		return test.CustomScript
	}

	var sb strings.Builder

	// Imports
	sb.WriteString("import http from 'k6/http';\n")
	sb.WriteString("import { check, sleep } from 'k6';\n\n")

	// Export Options
	sb.WriteString("export const options = {\n")

	switch test.Workload.Model {
	case performance.ModelConstantVUs:
		sb.WriteString(fmt.Sprintf("  vus: %d,\n", test.Workload.VUs))
		duration := test.Workload.Duration
		if duration == "" {
			duration = "30s"
		}
		sb.WriteString(fmt.Sprintf("  duration: '%s',\n", duration))

	case performance.ModelRampingVUs:
		sb.WriteString("  stages: [\n")
		for _, stage := range test.Workload.Stages {
			sb.WriteString(fmt.Sprintf("    { duration: '%s', target: %d },\n", stage.Duration, stage.Target))
		}
		sb.WriteString("  ],\n")

	case performance.ModelArrivalRate:
		sb.WriteString("  scenarios: {\n")
		sb.WriteString("    open_workload: {\n")
		sb.WriteString("      executor: 'constant-arrival-rate',\n")
		sb.WriteString(fmt.Sprintf("      rate: %d,\n", test.Workload.Rate))
		timeUnit := test.Workload.TimeUnit
		if timeUnit == "" {
			timeUnit = "1s"
		}
		sb.WriteString(fmt.Sprintf("      timeUnit: '%s',\n", timeUnit))
		sb.WriteString(fmt.Sprintf("      duration: '%s',\n", test.Workload.Duration))
		sb.WriteString(fmt.Sprintf("      preAllocatedVUs: %d,\n", test.Workload.PreAllocatedVUs))
		sb.WriteString(fmt.Sprintf("      maxVUs: %d,\n", test.Workload.MaxVUs))
		sb.WriteString("    },\n")
		sb.WriteString("  },\n")
	}

	// Thresholds
	if len(test.Thresholds) > 0 {
		sb.WriteString("  thresholds: {\n")
		for _, th := range test.Thresholds {
			condList := make([]string, len(th.Conditions))
			for i, c := range th.Conditions {
				condList[i] = fmt.Sprintf("'%s'", c)
			}
			sb.WriteString(fmt.Sprintf("    '%s': [%s],\n", th.Metric, strings.Join(condList, ", ")))
		}
		sb.WriteString("  },\n")
	}

	sb.WriteString("};\n\n")

	// Default Function
	sb.WriteString("export default function () {\n")

	if len(test.Scenarios) == 0 {
		// Default single request if no scenarios specified
		sb.WriteString("  const res = http.get('http://localhost:8080/health');\n")
		sb.WriteString("  check(res, { 'status is 200': (r) => r.status === 200 });\n")
		sb.WriteString("  sleep(1);\n")
	} else {
		for _, scenario := range test.Scenarios {
			for _, step := range scenario.Steps {
				req := requests[step.RequestID]
				if req == nil {
					continue
				}

				method := strings.ToLower(req.Method)
				url := req.URLTemplate
				for k, v := range resolvedVars {
					url = strings.ReplaceAll(url, "{{"+k+"}}", v)
				}

				sb.WriteString(fmt.Sprintf("  // Step: %s\n", step.Name))
				if method == "get" || method == "delete" || method == "head" || method == "options" {
					sb.WriteString(fmt.Sprintf("  let res = http.%s('%s');\n", method, url))
				} else {
					body := req.BodyContent
					if body == "" {
						body = "{}"
					}
					sb.WriteString(fmt.Sprintf("  let res = http.%s('%s', JSON.stringify(%s), { headers: { 'Content-Type': 'application/json' } });\n", method, url, body))
				}

				sb.WriteString("  check(res, { 'status is 2xx': (r) => r.status >= 200 && r.status < 300 });\n")

				if step.ThinkTime != "" {
					sb.WriteString(fmt.Sprintf("  sleep(%s);\n", strings.TrimSuffix(step.ThinkTime, "s")))
				} else {
					sb.WriteString("  sleep(1);\n")
				}
			}
		}
	}

	sb.WriteString("}\n")
	return sb.String()
}
