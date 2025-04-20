import React, { useState, useEffect } from 'react';
import { Briefcase } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';

const NotFound = () => {
  const navigate = useNavigate();
  const [key, setKey] = useState(0);
  const referringPage = document.referrer;

  useEffect(() => {
    // Set document title
    document.title = "404 - Page Not Found | LeadWeb";
    
    // Log the error for analytics
    console.error(
      "404 Error: User attempted to access non-existent route:",
      window.location.href
    );
  }, []);

  // For the animated briefcase effect
  const briefcaseVariants = {
    initial: { rotate: 0 },
    animate: {
      rotate: [0, 15, 0, -15, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse" as const,
      },
    },
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-background/80">
        <Card className="w-full max-w-4xl shadow-lg border-destructive/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <motion.div
                variants={briefcaseVariants}
                initial="initial"
                animate="animate"
              >
                <Briefcase className="h-16 w-16 text-red-500" />
              </motion.div>
            </div>
            <CardTitle className="text-4xl font-bold text-destructive flex justify-center items-center gap-2">
              <span className="text-5xl">404</span> 
              <span className="border-l-2 border-destructive/30 pl-2">Page Not Found</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center">
            <p className="text-xl text-muted-foreground mb-6">
              We couldn't find the page you were looking for.
            </p>
            
            <Tabs defaultValue="diagnosis" className="max-w-2xl mx-auto">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="diagnosis">What Happened</TabsTrigger>
                <TabsTrigger value="treatment">Next Steps</TabsTrigger>
              </TabsList>
              
              <TabsContent value="diagnosis" className="text-left">
                <Accordion type="single" collapsible defaultValue="symptoms" className="mb-6">
                  <AccordionItem value="symptoms">
                    <AccordionTrigger className="text-md font-medium">Possible Causes</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>The page may have been moved or deleted</li>
                        <li>You might have typed the address incorrectly</li>
                        <li>The link you followed may be outdated</li>
                        <li>The requested resource may be temporarily unavailable</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="details">
                    <AccordionTrigger className="text-md font-medium">Technical Details</AccordionTrigger>
                    <AccordionContent>
                      <div className="p-3 bg-muted rounded-md font-mono text-sm">
                        <p>Error: 404 Not Found</p>
                        <p>Request URL: {window.location.href}</p>
                        {referringPage && <p>Referring Page: {referringPage}</p>}
                        <p>Time: {new Date().toLocaleString()}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
              
              <TabsContent value="treatment">
                <div className="space-y-4 text-left">
                  <div className="p-4 border rounded-lg bg-card">
                    <h3 className="font-medium mb-2">Recommended Actions:</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Double-check the URL for typos</li>
                      <li>Go back to the previous page and try again</li>
                      <li>Navigate to our homepage</li>
                      <li>Use the dashboard to find what you're looking for</li>
                      <li>Contact support if you believe this is an error</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex flex-wrap justify-center gap-3 pt-2 pb-6">
            <Button onClick={() => navigate('/')} className="min-w-[140px]">
              Go to Homepage
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="min-w-[140px]">
              Go to Dashboard
            </Button>
            <Button onClick={() => navigate(-1)} variant="ghost" className="min-w-[140px]">
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default NotFound;
