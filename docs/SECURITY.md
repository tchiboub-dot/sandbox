# Security Guide - Cloud Device Lab

Comprehensive security documentation and best practices.

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Network Security](#network-security)
4. [Data Protection](#data-protection)
5. [VM Isolation](#vm-isolation)
6. [Monitoring & Auditing](#monitoring--auditing)
7. [Incident Response](#incident-response)
8. [Compliance](#compliance)

---

## Security Overview

### Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Minimal permissions required
3. **Zero Trust**: Verify everything, trust nothing
4. **Encryption Everywhere**: Data encrypted in transit and at rest
5. **Continuous Monitoring**: Real-time security monitoring

### Threat Model

**Assets to Protect**:
- User data and sessions
- VM instances
- Platform infrastructure
- API keys and credentials

**Threat Actors**:
- Malicious users
- External attackers
- Compromised VMs
- Insider threats

**Attack Vectors**:
- API exploitation
- WebRTC hijacking
- VM escape
- Network sniffing
- DDoS attacks
- Credential theft

---

## Authentication & Authorization

### User Authentication (To Implement)

**Recommended**: OAuth 2.0 + OpenID Connect

```typescript
// Example implementation
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(CLIENT_ID);

async function verifyToken(token: string) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID
  });
  
  const payload = ticket.getPayload();
  return {
    userId: payload['sub'],
    email: payload['email']
  };
}
```

**Supported Providers**:
- Google OAuth
- GitHub OAuth
- Microsoft Azure AD
- Custom OIDC providers

---

### API Authentication

**JWT (JSON Web Tokens)**

```typescript
import jwt from 'jsonwebtoken';

// Generate token
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

**API Key Authentication** (for machine-to-machine):

```http
Authorization: Bearer <api-key>
```

---

### Role-Based Access Control (RBAC)

**Roles**:

| Role | Permissions |
|------|-------------|
| `anonymous` | View public info |
| `user` | Create sessions, view own sessions |
| `premium` | Extended sessions, priority queue |
| `admin` | View all sessions, manage platform |
| `superadmin` | Full system access |

**Implementation**:

```typescript
const permissions = {
  'user': ['session:create', 'session:read:own'],
  'admin': ['session:create', 'session:read:all', 'session:delete:all'],
  'superadmin': ['*']
};

function checkPermission(user: User, permission: string) {
  const userPerms = permissions[user.role] || [];
  return userPerms.includes('*') || userPerms.includes(permission);
}
```

---

## Network Security

### TLS/SSL Encryption

**Requirements**:
- TLS 1.2 or higher
- Strong cipher suites only
- HSTS enabled
- Certificate pinning for mobile apps

**Nginx Configuration**:

```nginx
server {
    listen 443 ssl http2;
    server_name clouddevicelab.com;
    
    ssl_certificate /etc/ssl/certs/clouddevicelab.crt;
    ssl_certificate_key /etc/ssl/private/clouddevicelab.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers on;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

---

### Kubernetes Network Policies

**Default Deny All**:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: cloud-device-lab
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

**Allow Frontend → API**:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-to-api
  namespace: cloud-device-lab
spec:
  podSelector:
    matchLabels:
      app: api-server
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 5000
```

---

### Firewall Rules

**VM Host Firewall** (iptables):

```bash
# Default deny
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow established connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow from control plane only
iptables -A INPUT -s 10.0.0.0/24 -j ACCEPT

# Allow WebRTC ports
iptables -A INPUT -p udp --dport 10000:20000 -j ACCEPT

# Drop everything else
iptables -A INPUT -j DROP
```

---

### DDoS Protection

**Rate Limiting** (Nginx):

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=conn:10m;

server {
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        limit_conn conn 10;
    }
}
```

**Application-Level Rate Limiting** (Express):

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per minute
  message: 'Too many requests, please try again later'
});

app.use('/api/', limiter);
```

---

## Data Protection

### Database Encryption

**Encryption at Rest**:
- PostgreSQL: Transparent Data Encryption (TDE)
- Disk-level encryption: LUKS or cloud provider encryption

**Encryption in Transit**:
```bash
# PostgreSQL SSL configuration
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
ssl_ca_file = '/path/to/ca.crt'
```

---

### Secrets Management

**Kubernetes Secrets** (encrypted at rest):

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: cloud-device-lab
type: Opaque
data:
  username: cG9zdGdyZXM=  # base64 encoded
  password: <encrypted>
```

**External Secrets Manager** (recommended for production):

```yaml
# AWS Secrets Manager
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: postgres-secret
spec:
  secretStoreRef:
    name: aws-secrets-manager
  target:
    name: postgres-secret
  data:
  - secretKey: password
    remoteRef:
      key: prod/db/postgres/password
```

---

### PII Protection

**Data Minimization**:
- Only collect necessary data
- Anonymize where possible
- Regular data purging

**Data Masking**:

```typescript
function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  return `${user[0]}***@${domain}`;
}

function maskIP(ip: string): string {
  const parts = ip.split('.');
  return `${parts[0]}.${parts[1]}.***.**`;
}
```

---

## VM Isolation

### Container Security

**Docker Security Best Practices**:

```dockerfile
# Use minimal base image
FROM ubuntu:20.04-minimal

# Run as non-root user
RUN useradd -m -u 1000 vmuser
USER vmuser

# Read-only filesystem
--read-only

# Drop capabilities
--cap-drop=ALL
--cap-add=NET_BIND_SERVICE

# Resource limits
--memory=4g
--cpus=2
--pids-limit=1024

# No privileged mode
--privileged=false
```

---

### KVM Isolation

**VM Resource Limits**:

```bash
# CPU pinning
taskset -c 0-3 qemu-system-x86_64 ...

# Memory limit
-m 4096

# Network isolation (private bridge)
-netdev bridge,id=net0,br=virbr-vm1
-device virtio-net-pci,netdev=net0

# Disable unnecessary devices
-nodefaults
-no-user-config
```

**SELinux/AppArmor**:

```bash
# AppArmor profile for QEMU
/usr/bin/qemu-system-x86_64 {
  capability net_admin,
  capability sys_resource,
  /dev/kvm rw,
  /var/lib/libvirt/images/** rw,
  network inet stream,
  deny /proc/sys/kernel/** w,
  deny /sys/** w,
}
```

---

### Network Isolation per VM

```yaml
# Each VM gets isolated network namespace
apiVersion: v1
kind: Pod
metadata:
  name: vm-pod
spec:
  containers:
  - name: vm
    securityContext:
      runAsNonRoot: true
      readOnlyRootFilesystem: true
  hostNetwork: false  # Isolated network
```

---

## Monitoring & Auditing

### Security Logging

**Events to Log**:
- Authentication attempts (success/failure)
- Session creation/deletion
- API requests (method, endpoint, user, IP)
- Admin actions
- Configuration changes
- VM lifecycle events
- Network anomalies

**Log Format** (JSON):

```json
{
  "timestamp": "2024-03-09T10:00:00Z",
  "level": "INFO",
  "event": "session.created",
  "userId": "uuid",
  "ip": "1.2.3.4",
  "sessionId": "uuid",
  "deviceType": "android",
  "metadata": {}
}
```

---

### Intrusion Detection

**Suspicious Activities**:
- Multiple failed login attempts
- Unusual API usage patterns
- High resource consumption
- VM escape attempts
- Network scanning

**Automated Response**:

```typescript
// Auto-ban after 5 failed logins
const failedAttempts = await redis.incr(`login_fail:${ip}`);
await redis.expire(`login_fail:${ip}`, 300); // 5 minutes

if (failedAttempts >= 5) {
  await banIP(ip, 3600); // Ban for 1 hour
  await alertSecurity({ event: 'brute_force', ip });
}
```

---

### Security Scanning

**Container Image Scanning**:

```bash
# Trivy scan
trivy image clouddevicelab/frontend:latest

# Fail CI/CD if critical vulnerabilities found
trivy image --exit-code 1 --severity CRITICAL clouddevicelab/frontend:latest
```

**Dependency Scanning**:

```bash
# npm audit
npm audit --audit-level=high

# Snyk
snyk test --severity-threshold=high
```

---

## Incident Response

### Incident Response Plan

**Phases**:
1. **Detection**: Monitoring alerts triggered
2. **Analysis**: Determine severity and scope
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threat
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Post-mortem analysis

---

### Security Incident Playbooks

#### Compromised VM

```bash
# 1. Isolate VM
kubectl delete networkpolicy vm-allow-egress

# 2. Suspend VM
virsh suspend <vm-id>

# 3. Take snapshot for forensics
virsh snapshot-create <vm-id>

# 4. Terminate session
curl -X DELETE /api/sessions/<session-id>

# 5. Alert user
notify_user(session.userId, "Security incident detected")

# 6. Analyze logs
grep "session-id" /var/log/platform/* > incident-report.log
```

---

#### Data Breach

```bash
# 1. Isolate affected systems
kubectl scale deployment api-server --replicas=0

# 2. Notify authorities (GDPR: 72 hours)
notify_dpo()

# 3. Assess data exposure
SELECT * FROM sessions WHERE created_at > '2024-03-09';

# 4. Notify affected users
notify_users(affected_user_ids)

# 5. Implement fixes
apply_security_patches()

# 6. Resume operations
kubectl scale deployment api-server --replicas=5
```

---

## Compliance

### GDPR Compliance

**User Rights**:
- Right to access: Export user data
- Right to erasure: Delete all user data
- Right to portability: Data export in machine-readable format

**Implementation**:

```typescript
// Export user data
app.get('/api/users/:userId/export', async (req, res) => {
  const userData = await db.query(
    'SELECT * FROM sessions WHERE user_id = $1',
    [req.params.userId]
  );
  
  res.json({
    user: userData,
    generatedAt: new Date().toISOString()
  });
});

// Delete user data
app.delete('/api/users/:userId', async (req, res) => {
  await db.query('DELETE FROM sessions WHERE user_id = $1', [req.params.userId]);
  await db.query('DELETE FROM users WHERE id = $1', [req.params.userId]);
  
  res.json({ message: 'User data deleted' });
});
```

---

### SOC 2 Compliance

**Controls**:
- Access control (authentication, RBAC)
- Change management (version control, CI/CD)
- Data protection (encryption, backups)
- Monitoring (logging, alerting)
- Incident response (playbooks, documentation)

---

### PCI DSS (if handling payments)

**Requirements**:
- Never store credit card data
- Use PCI-compliant payment processor (Stripe, etc.)
- TLS for all payment flows
- Regular security audits
- Network segmentation

---

## Security Checklist

### Pre-Production

- [ ] Authentication implemented
- [ ] Authorization/RBAC configured
- [ ] TLS certificates installed
- [ ] Secrets stored securely
- [ ] Database encrypted
- [ ] Network policies applied
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] Security headers set
- [ ] Vulnerability scanning passed
- [ ] Penetration testing completed
- [ ] Security monitoring configured
- [ ] Incident response plan documented
- [ ] Backup/recovery tested
- [ ] Compliance requirements met

---

### Ongoing

- [ ] Security patches applied monthly
- [ ] Dependency updates weekly
- [ ] Log review daily
- [ ] Vulnerability scans weekly
- [ ] Penetration tests quarterly
- [ ] Incident response drills quarterly
- [ ] Security training annually
- [ ] Compliance audits annually

---

## Security Contacts

**Report Security Issues**:
- Email: security@clouddevicelab.com
- PGP Key: [public key link]
- Bug Bounty: HackerOne program

**Responsible Disclosure**:
- Report vulnerabilities privately
- Allow 90 days for fix before public disclosure
- We will acknowledge within 48 hours

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Kubernetes Benchmark](https://www.cisecurity.org/benchmark/kubernetes)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Cloud Security Alliance](https://cloudsecurityalliance.org/)

---

**Security is everyone's responsibility. Stay vigilant!**
