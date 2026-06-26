# Agent Prompt: Fix Terraform Infrastructure Errors

When you encounter a terraform error, follow this exact process:

## Step 1: Read the Error
Copy the FULL error message. Identify:
- Which file (e.g., `ec2.tf`, `iam.tf`)
- Which line number
- What type of error (missing file, syntax, variable, etc.)

## Step 2: Common Fixes

### "no file exists" error
The `.tf` file references a script/file that doesn't exist in `terraform/scripts/`.
- Create the missing file in `terraform/scripts/`
- Keep it minimal - just what's needed to pass validation

### "argument is required" error
A variable or block is missing.
- Check `terraform/variables.tf` for the variable definition
- Add it to `terraform/terraform.tfvars` with a default value

### "invalid value" error
Variable value doesn't match validation rules.
- Read the validation block in `variables.tf`
- Fix the value in `terraform.tfvars`

### "reference not found" error
A resource or data source doesn't exist.
- Check if the resource is defined in another `.tf` file
- Verify the name matches exactly (case-sensitive)

## Step 3: Validate After Fix
```bash
cd terraform
terraform fmt -check
terraform validate
```

Both must pass before considering the fix complete.

## Step 4: Document What You Did
Tell the user:
1. What the error was
2. What file you changed
3. What the fix was
4. That terraform validate now passes

## Files You Can Modify
- `terraform/*.tf` - Main terraform files
- `terraform/scripts/*.sh` - Bootstrap scripts
- `terraform/terraform.tfvars` - Variable values (never commit secrets)
- `terraform/variables.tf` - Variable definitions

## Do NOT
- Change variable names that are used in outputs
- Remove resources that other resources depend on
- Add secrets directly to files
- Skip the validate step
