import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ArrowRight, Mail, Building, User, Phone } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  company: z.string().optional(),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  useCase: z.string().min(10, { message: "Please tell us a bit more about your needs." }).max(500, { message: "Message is too long." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function LeadGen() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      useCase: "",
    },
  });

  // Set document title
  document.title = "Join the Waitlist - Business Lead Generator";

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Store the lead in Firebase
      await addDoc(collection(db, "waitlistLeads"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      
      // Show success message
      setIsSubmitted(true);
      
      toast({
        title: "Thank you for your interest!",
        description: "We'll notify you as soon as we launch.",
      });
    } catch (error) {
      console.error("Error saving lead to Firebase:", error);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "We couldn't save your information. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50">
      {/* Hero Section with form */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-teal-100 border border-teal-200 mb-4">
            <span className="text-sm font-medium text-teal-700">🚀 Coming Soon</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
            Be the First to Access <br /> Our Business Lead Generator
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Join our exclusive waitlist to get early access to the most powerful business lead generation tool on the market.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left column: Benefits */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-800">Why Join Our Waitlist?</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 bg-teal-100 rounded-full p-1.5">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Early Access</h3>
                  <p className="text-gray-600">Be among the first to use our platform and gain a competitive advantage.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="mt-1 bg-teal-100 rounded-full p-1.5">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Exclusive Discounts</h3>
                  <p className="text-gray-600">Waitlist members receive special pricing on our premium features.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="mt-1 bg-teal-100 rounded-full p-1.5">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Priority Support</h3>
                  <p className="text-gray-600">Get dedicated support to maximize your lead generation success.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="mt-1 bg-teal-100 rounded-full p-1.5">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Input on Features</h3>
                  <p className="text-gray-600">Help shape our product by providing feedback during development.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-teal-100 shadow-sm">
              <h3 className="font-bold text-lg mb-2">Limited Time Offer</h3>
              <p className="text-gray-700">
                The first 100 users who join our waitlist will receive a <span className="font-semibold text-teal-600">free 30-day premium access</span> upon launch.
              </p>
            </div>
          </div>
          
          {/* Right column: Form */}
          <div>
            {!isSubmitted ? (
              <Card className="shadow-lg border-teal-100">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold">Join Our Waitlist</CardTitle>
                  <CardDescription>
                    Enter your details below to secure your spot.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input className="pl-10" placeholder="John Smith" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input className="pl-10" placeholder="you@example.com" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name (Optional)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                  <Input className="pl-10" placeholder="Acme Inc." {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                  <Input className="pl-10" placeholder="+1 (555) 000-0000" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="useCase"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>How would you use our lead generator?</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us about your business needs and how you plan to use our lead generation tool..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              This helps us understand your needs better.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Submitting...' : 'Join Waitlist'} 
                        {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg border-teal-100 text-center p-8">
                <div className="flex justify-center mb-6">
                  <div className="bg-teal-100 rounded-full p-3">
                    <CheckCircle2 className="h-10 w-10 text-teal-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold mb-4">Thank You for Joining!</CardTitle>
                <CardDescription className="text-base mb-6">
                  You're now on our waitlist. We'll notify you as soon as we launch.
                </CardDescription>
                <Button 
                  onClick={() => navigate('/')}
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600"
                >
                  Explore Our Site
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Testimonials/Social Proof */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Early Testers Are Saying</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                  <span className="font-bold text-teal-600">JM</span>
                </div>
                <div>
                  <p className="font-semibold">Jason Miller</p>
                  <p className="text-sm text-gray-500">Marketing Director</p>
                </div>
              </div>
              <p className="text-gray-700">
                "This lead generation tool has completely transformed how we approach new client acquisition. The quality of leads is substantially better than what we were getting before."
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                  <span className="font-bold text-emerald-600">SJ</span>
                </div>
                <div>
                  <p className="font-semibold">Sarah Johnson</p>
                  <p className="text-sm text-gray-500">Sales Manager</p>
                </div>
              </div>
              <p className="text-gray-700">
                "We've seen a 43% increase in conversion rates since we started using this platform. The ability to target specific business categories has been a game-changer for our team."
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                  <span className="font-bold text-teal-600">RK</span>
                </div>
                <div>
                  <p className="font-semibold">Robert Kim</p>
                  <p className="text-sm text-gray-500">Business Owner</p>
                </div>
              </div>
              <p className="text-gray-700">
                "As a small business owner, this tool has given me access to prospects I never would have found otherwise. It's easy to use and the leads are highly relevant to my services."
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer CTA */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Don't Miss Out on This Opportunity</h2>
        <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
          Our business lead generator is launching soon. Join the waitlist now to secure your spot and get exclusive early access benefits.
        </p>
        {!isSubmitted ? (
          <Button
            onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
            size="lg"
            className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600"
          >
            Join Waitlist Now <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <p className="text-teal-600 font-semibold text-lg">
            You're on the waitlist! We'll be in touch soon.
          </p>
        )}
      </div>
    </div>
  );
} 