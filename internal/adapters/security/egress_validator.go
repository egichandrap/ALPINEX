package security

import (
	"context"
	"errors"
	"net"
	"net/url"
	"strings"
)

var (
	ErrInvalidTargetURL = errors.New("invalid target URL")
	ErrSSRFBlocked      = errors.New("target destination blocked by SSRF egress policy (private/loopback/metadata IP)")
)

type EgressValidator struct {
	allowPrivateIPs bool
}

func NewEgressValidator(allowPrivateIPs bool) *EgressValidator {
	return &EgressValidator{allowPrivateIPs: allowPrivateIPs}
}

func (v *EgressValidator) ValidateTargetURL(ctx context.Context, targetURL string) error {
	parsed, err := url.Parse(targetURL)
	if err != nil || parsed.Host == "" {
		return ErrInvalidTargetURL
	}

	scheme := strings.ToLower(parsed.Scheme)
	if scheme != "http" && scheme != "https" {
		return errors.New("unsupported protocol scheme: only http and https allowed")
	}

	if v.allowPrivateIPs {
		return nil // Permitted in development mode
	}

	host := parsed.Hostname()
	ips, err := net.LookupIP(host)
	if err != nil {
		return err
	}

	for _, ip := range ips {
		if isPrivateOrForbiddenIP(ip) {
			return ErrSSRFBlocked
		}
	}

	return nil
}

func isPrivateOrForbiddenIP(ip net.IP) bool {
	if ip.IsLoopback() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() || ip.IsPrivate() {
		return true
	}

	// Explicit block for Cloud Metadata service: 169.254.169.254
	metadataIP := net.ParseIP("169.254.169.254")
	if ip.Equal(metadataIP) {
		return true
	}

	return false
}
