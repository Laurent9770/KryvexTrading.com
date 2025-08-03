import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import kycService from '@/services/kycService';
import { 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Upload,
  FileText,
  Camera,
  MapPin,
  CreditCard,
  Calendar,
  User
} from 'lucide-react';

interface KYCSubmissionFormProps {
  onSubmissionComplete?: () => void;
}

const KYCSubmissionForm: React.FC<KYCSubmissionFormProps> = ({ onSubmissionComplete }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    country: '',
    dateOfBirth: '',
    documentType: 'passport' as 'passport' | 'national_id' | 'drivers_license',
    remarks: ''
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const countries = kycService.getCountries();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to submit KYC documents."
      });
      return;
    }

    if (!formData.fullName.trim()) {
      toast({
        variant: "destructive",
        title: "Full Name Required",
        description: "Please enter your full name as it appears on your ID."
      });
      return;
    }

    if (!formData.country) {
      toast({
        variant: "destructive",
        title: "Country Required",
        description: "Please select your country of residence."
      });
      return;
    }

    if (!formData.dateOfBirth) {
      toast({
        variant: "destructive",
        title: "Date of Birth Required",
        description: "Please enter your date of birth."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock document uploads - in real app, these would be actual file uploads
      const documents = {
        idFront: '/mock-documents/id-front.jpg',
        idBack: formData.documentType === 'passport' ? '/mock-documents/id-back.jpg' : undefined,
        selfie: '/mock-documents/selfie.jpg',
        proofOfAddress: '/mock-documents/address-proof.pdf'
      };

      const submission = kycService.createKYCSubmission(
        user.id,
        user.username || user.email.split('@')[0],
        user.email,
        formData.fullName.trim(),
        formData.country,
        formData.dateOfBirth,
        formData.documentType,
        documents,
        formData.remarks.trim() || undefined
      );

      toast({
        title: "KYC Submitted Successfully",
        description: "Your KYC documents have been submitted and are under review. You will be notified of the status."
      });

      // Reset form
      setFormData({
        fullName: '',
        country: '',
        dateOfBirth: '',
        documentType: 'passport',
        remarks: ''
      });

      onSubmissionComplete?.();
    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Failed to submit KYC documents. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          KYC Verification
        </CardTitle>
        <CardDescription>
          Submit your identity verification documents. All documents are securely processed and encrypted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name (as on ID)</Label>
              <Input
                id="fullName"
                placeholder="Enter your full name exactly as it appears on your ID"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country of Residence</Label>
                <Select value={formData.country} onValueChange={(country) => setFormData(prev => ({ ...prev, country }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Document Type */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Document Type
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="documentType">Identity Document Type</Label>
              <Select value={formData.documentType} onValueChange={(type) => setFormData(prev => ({ ...prev, documentType: type as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="national_id">National ID Card</SelectItem>
                  <SelectItem value="drivers_license">Driver's License</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Document Upload
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idFront" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  ID Front Side *
                </Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF (max 5MB)</p>
                </div>
              </div>

              {formData.documentType === 'passport' && (
                <div className="space-y-2">
                  <Label htmlFor="idBack" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    ID Back Side
                  </Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF (max 5MB)</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="selfie" className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Selfie with ID *
                </Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG (max 5MB)</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proofOfAddress" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Proof of Address (Optional)
                </Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF (max 5MB)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Additional Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              placeholder="Any additional information you'd like to provide"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Security Notice */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Security & Privacy Notice
                </p>
                <ul className="text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• All documents are encrypted and securely stored</li>
                  <li>• Your information is protected by industry-standard security</li>
                  <li>• Documents are only used for identity verification</li>
                  <li>• Processing typically takes 24-48 hours</li>
                  <li>• You will be notified of approval or rejection</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting KYC...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit KYC Verification
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default KYCSubmissionForm; 