# Agent 3 - Save GLB Roundtrip Verification Task

**Agent**: Agent 3 (Animation Systems Team)  
**Priority**: CRITICAL  
**Status**: PENDING  
**Start Time**: 2025-01-27T15:30:00Z  
**Coordinator**: NEW  

---

## 📋 **TASK OVERVIEW**

Complete the Save GLB roundtrip verification that was partially completed in headless testing. The previous test captured 0 bytes (ROUNDTRIP=false) and requires manual/non-headless verification.

---

## 🎯 **SPECIFIC REQUIREMENTS**

### **Current Issue**
- **Problem**: Save GLB roundtrip captured 0 bytes in headless harness
- **Status**: ROUNDTRIP=false (failed)
- **Previous Test**: `node scripts/test_save_glb_roundtrip.cjs`
- **Result**: GLB_CAPTURED 0; insufficient for acceptance

### **Required Actions**
1. **Manual Testing**: Test Save GLB functionality in non-headless environment
2. **Download Verification**: Verify actual GLB file download and capture
3. **Roundtrip Validation**: Ensure downloaded GLB can be reloaded successfully
4. **Documentation**: Update completion report with results

---

## 🔧 **IMPLEMENTATION STEPS**

### **Step 1: Manual Save GLB Testing**
- Navigate to `/viewer-beta` route (feature-flagged)
- Load default FBX model: `public/models/Default_Model.fbx`
- Click "Save GLB" button
- Verify download initiates and completes
- Check file size and format

### **Step 2: Roundtrip Validation**
- Download the generated GLB file
- Attempt to reload the GLB file back into the viewer
- Verify model loads correctly with animations
- Check for any parsing errors or issues

### **Step 3: CDP Download Capture (Alternative)**
If manual testing is insufficient, implement CDP download capture:
- Modify test script to enable CDP download capture
- Ensure proper blob handling and file capture
- Verify non-empty GLB file generation

### **Step 4: Documentation**
- Update `coordination/AGENT_3_ANIMATION_TESTING_REPORT.md`
- Log results in `coordination/SERVER_STATUS_TRACKER.md`
- Document any issues or workarounds found

---

## ✅ **ACCEPTANCE CRITERIA**

### **Must Pass**
- [ ] Save GLB button triggers download
- [ ] Downloaded file is non-empty GLB format
- [ ] File size > 0 bytes (substantial model data)
- [ ] GLB can be reloaded into viewer
- [ ] Model displays correctly after reload
- [ ] No parsing errors in console
- [ ] Documentation updated with results

### **Success Metrics**
- **File Size**: > 1MB (reasonable for 3D model)
- **Format**: Valid GLB file
- **Roundtrip**: Successful reload without errors
- **Performance**: No significant performance degradation

---

## 📁 **FILES TO WORK WITH**

### **Primary Files**
- `public/legacy/viewer_iframe.html` - Main viewer interface
- `public/legacy/legacy_composite_sandbox.html` - Sandbox environment
- `scripts/test_save_glb_roundtrip.cjs` - Test script (if needed)

### **Documentation Files**
- `coordination/AGENT_3_ANIMATION_TESTING_REPORT.md` - Update with results
- `coordination/SERVER_STATUS_TRACKER.md` - Log access and results
- `coordination/LIVE_ACTIVITY_TRACKER.md` - Update status

---

## 🚨 **IMPORTANT NOTES**

### **Server Status**
- **Server**: ACTIVE on port 3001
- **Access**: Read-only testing only
- **No Start/Stop**: Server already running

### **Testing Protocol**
- Use manual browser testing for Save GLB functionality
- Verify actual file download and content
- Test roundtrip loading capability
- Document all findings thoroughly

### **Dependencies**
- **Blocks**: Phase 3 completion
- **Requires**: Active server on port 3001
- **Dependent On**: Agent 2's offline vendorization (✅ COMPLETED)

---

## 📊 **EXPECTED OUTCOMES**

### **Success Scenario**
- Save GLB functionality works correctly
- Non-empty GLB files generated
- Roundtrip loading successful
- Phase 3 completion ready

### **Failure Scenario**
- Document specific issues found
- Provide workarounds or alternative approaches
- Update completion report with detailed findings

---

## 🕐 **TIMELINE**

- **Start**: Immediate
- **Target Completion**: 1 hour
- **Critical Path**: Phase 3 completion depends on this verification

---

**Coordinator Notes**: This is the final verification needed to complete Phase 3. Agent 3 should focus on manual testing to ensure the Save GLB functionality works correctly in a real browser environment.
