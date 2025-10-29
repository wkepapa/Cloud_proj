# 🗄️ DynamoDB Tables - Detailed Configuration Guide

Complete specifications for creating DynamoDB tables for the Stotra Elections Platform.

## 📊 Table 1: Votes Table

### **Basic Information**
- **Table Name**: `stotra-elections-votes`
- **Purpose**: Store individual user votes
- **Access Pattern**: One vote per user, query by userId

### **Key Schema**
```
Partition Key (Primary Key):
- Attribute Name: userId
- Attribute Type: String (S)
- Description: Cognito user ID (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890")

Sort Key: None (not needed for this table)
```

### **Attribute Definitions**
```json
[
  {
    "AttributeName": "userId",
    "AttributeType": "S"
  }
]
```

### **Table Settings**

#### **Capacity Settings**
- **Billing Mode**: On-demand
- **Read/Write Capacity**: Auto-managed by AWS
- **Why**: Cost-effective for variable workloads

#### **Global Secondary Indexes (GSI)**
- **None required** for basic functionality
- **Optional GSI for analytics**:
  ```
  GSI Name: candidateId-timestamp-index
  Partition Key: candidateId (String)
  Sort Key: timestamp (String)
  Purpose: Query votes by candidate with time ordering
  ```

#### **Local Secondary Indexes (LSI)**
- **None required**

#### **Table Class**
- **Standard**: For frequently accessed data
- **Standard-IA**: Not recommended (votes are frequently queried)

#### **Encryption**
- **Encryption at rest**: Enabled (AWS managed key)
- **Encryption in transit**: Enabled by default

#### **Point-in-time Recovery**
- **Enabled**: Recommended for production
- **Disabled**: OK for development

#### **Stream Settings**
- **DynamoDB Streams**: Disabled (not needed)
- **Kinesis Data Streams**: Disabled

#### **Tags**
```
Environment: dev
Project: stotra-elections
Component: votes-storage
```

### **Sample Data Structure**
```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "candidateId": "1",
  "candidateName": "Alice Johnson",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "sessionId": "sess_abc123def456"
}
```

### **Access Patterns**
1. **Check if user voted**: `GetItem` by userId
2. **Cast vote**: `PutItem` with userId as key
3. **Get all votes**: `Scan` entire table (for results)
4. **Get votes by candidate**: `Scan` with filter (or use GSI)

---

## 📊 Table 2: Candidates Table

### **Basic Information**
- **Table Name**: `stotra-elections-candidates`
- **Purpose**: Store candidate information
- **Access Pattern**: Read-heavy, infrequent updates

### **Key Schema**
```
Partition Key (Primary Key):
- Attribute Name: id
- Attribute Type: String (S)
- Description: Unique candidate identifier (e.g., "1", "2", "3")

Sort Key: None (not needed for this table)
```

### **Attribute Definitions**
```json
[
  {
    "AttributeName": "id",
    "AttributeType": "S"
  }
]
```

### **Table Settings**

#### **Capacity Settings**
- **Billing Mode**: On-demand
- **Read/Write Capacity**: Auto-managed by AWS
- **Why**: Low write volume, predictable read patterns

#### **Global Secondary Indexes (GSI)**
- **None required** for basic functionality
- **Optional GSI for sorting**:
  ```
  GSI Name: status-name-index
  Partition Key: status (String) - "active", "inactive"
  Sort Key: name (String)
  Purpose: Get active candidates sorted by name
  ```

#### **Local Secondary Indexes (LSI)**
- **None required**

#### **Table Class**
- **Standard**: Recommended (frequently read)

#### **Encryption**
- **Encryption at rest**: Enabled (AWS managed key)
- **Encryption in transit**: Enabled by default

#### **Point-in-time Recovery**
- **Enabled**: Recommended for production
- **Disabled**: OK for development

#### **Stream Settings**
- **DynamoDB Streams**: Disabled (not needed)

#### **Tags**
```
Environment: dev
Project: stotra-elections
Component: candidates-storage
```

### **Sample Data Structure**
```json
{
  "id": "1",
  "name": "Alice Johnson",
  "description": "Experienced leader with a vision for positive change and student advocacy.",
  "platform": "Focus on student welfare, campus improvements, and academic excellence.",
  "image": "https://example.com/images/alice.jpg",
  "status": "active",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "metadata": {
    "party": "Student Union",
    "experience": "3 years",
    "contact": "alice@university.edu"
  }
}
```

### **Access Patterns**
1. **Get all candidates**: `Scan` entire table
2. **Get specific candidate**: `GetItem` by id
3. **Update candidate**: `UpdateItem` by id
4. **Add new candidate**: `PutItem` with unique id

---

## 🔧 Step-by-Step Creation Process

### **Step 1: Create Votes Table**

1. **Go to DynamoDB Console**
   - URL: https://console.aws.amazon.com/dynamodb/
   - Region: us-east-1 (N. Virginia)

2. **Click "Create table"**

3. **Table details**
   ```
   Table name: stotra-elections-votes
   ```

4. **Partition key**
   ```
   Partition key: userId
   Type: String
   ```

5. **Sort key**
   ```
   ☐ Add sort key (leave unchecked)
   ```

6. **Table settings**
   ```
   ☑ Customize settings
   ```

7. **Read/write capacity settings**
   ```
   Capacity mode: ● On-demand
   ```

8. **Secondary indexes**
   ```
   Global secondary indexes: None (skip for now)
   Local secondary indexes: None
   ```

9. **Encryption at rest**
   ```
   ● Owned by Amazon DynamoDB
   ```

10. **Point-in-time recovery**
    ```
    ☐ Enable point-in-time recovery (optional)
    ```

11. **Tags (optional)**
    ```
    Key: Environment, Value: dev
    Key: Project, Value: stotra-elections
    ```

12. **Click "Create table"**

### **Step 2: Create Candidates Table**

1. **Click "Create table" again**

2. **Table details**
   ```
   Table name: stotra-elections-candidates
   ```

3. **Partition key**
   ```
   Partition key: id
   Type: String
   ```

4. **Sort key**
   ```
   ☐ Add sort key (leave unchecked)
   ```

5. **Table settings**
   ```
   ☑ Customize settings
   ```

6. **Read/write capacity settings**
   ```
   Capacity mode: ● On-demand
   ```

7. **Secondary indexes**
   ```
   Global secondary indexes: None
   Local secondary indexes: None
   ```

8. **Encryption at rest**
   ```
   ● Owned by Amazon DynamoDB
   ```

9. **Point-in-time recovery**
   ```
   ☐ Enable point-in-time recovery (optional)
   ```

10. **Tags (optional)**
    ```
    Key: Environment, Value: dev
    Key: Project, Value: stotra-elections
    ```

11. **Click "Create table"**

---

## 🧪 Testing Tables

### **Test Votes Table**

1. **Go to Tables → stotra-elections-votes**
2. **Click "Explore table items"**
3. **Click "Create item"**
4. **Add test data**:
   ```json
   {
     "userId": "test-user-123",
     "candidateId": "1",
     "candidateName": "Alice Johnson",
     "timestamp": "2024-01-15T14:30:00.000Z"
   }
   ```
5. **Click "Create item"**

### **Test Candidates Table**

1. **Go to Tables → stotra-elections-candidates**
2. **Click "Explore table items"**
3. **Click "Create item"**
4. **Add test data**:
   ```json
   {
     "id": "1",
     "name": "Alice Johnson",
     "description": "Experienced leader with a vision for change",
     "platform": "Focus on student welfare and campus improvements"
   }
   ```
5. **Click "Create item"**

---

## 📊 Capacity Planning

### **Expected Usage**

**Votes Table:**
- **Reads**: 100-1000 per day (checking vote status, getting results)
- **Writes**: 50-500 per day (casting votes)
- **Storage**: ~1KB per vote × number of users

**Candidates Table:**
- **Reads**: 1000-10000 per day (displaying candidates)
- **Writes**: 1-10 per month (updating candidate info)
- **Storage**: ~2KB per candidate × number of candidates

### **Cost Estimation (On-Demand)**

**Votes Table (500 users):**
- **Read**: $0.25 per million reads × 0.001 = ~$0.0003/day
- **Write**: $1.25 per million writes × 0.0005 = ~$0.0006/day
- **Storage**: $0.25/GB/month × 0.5MB = ~$0.0001/month

**Candidates Table (10 candidates):**
- **Read**: $0.25 per million reads × 0.01 = ~$0.0025/day
- **Write**: $1.25 per million writes × 0.00001 = ~$0.00001/day
- **Storage**: $0.25/GB/month × 20KB = ~$0.000005/month

**Total estimated cost**: <$1/month for typical usage

---

## 🔐 Security Considerations

### **Access Control**
- **IAM Policies**: Restrict access to specific tables
- **VPC Endpoints**: For private network access
- **Encryption**: Always enabled for sensitive data

### **Data Privacy**
- **No PII in keys**: Use Cognito user IDs, not emails
- **Audit Logging**: Enable CloudTrail for table access
- **Backup Strategy**: Point-in-time recovery for production

### **Performance Optimization**
- **Hot Partitions**: Avoid sequential IDs for high-write scenarios
- **Query Patterns**: Design keys based on access patterns
- **Caching**: Use ElastiCache for frequently accessed data

---

## 🚨 Common Mistakes to Avoid

1. **Wrong Key Types**: Using Number instead of String
2. **Missing Permissions**: Lambda can't access tables
3. **Case Sensitivity**: Table names are case-sensitive
4. **Region Mismatch**: Tables and Lambda in different regions
5. **Capacity Mode**: Provisioned vs On-demand confusion

---

## ✅ Verification Checklist

After creating tables, verify:

- [ ] Both tables created successfully
- [ ] Correct partition keys (userId, id)
- [ ] No sort keys defined
- [ ] On-demand billing mode
- [ ] Encryption enabled
- [ ] Correct region (us-east-1)
- [ ] Test items can be created
- [ ] IAM role has access permissions

Your DynamoDB tables are now ready for the Lambda function! 🎉