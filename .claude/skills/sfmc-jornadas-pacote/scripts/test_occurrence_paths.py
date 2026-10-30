import unittest
from extract_messages import journey_occurrence_paths

class PackageStub:
    def resolve(self, value):
        return value

class OccurrencePathsTest(unittest.TestCase):
    def test_join_preserves_both_outcomes(self):
        graph = {'activities': [
            {'key':'split','type':'RANDOMSPLIT','outcomes':[{'key':'a','next':'message'},{'key':'b','next':'message'}]},
            {'key':'message','type':'EMAILV2','outcomes':[]}]}
        paths = journey_occurrence_paths(PackageStub(), graph)['message']
        self.assertEqual(len(paths),2)
        self.assertEqual({p[0]['outcome_key'] for p in paths},{'a','b'})

    def test_engagement_reference_and_einstein_window(self):
        graph = {'activities': [
            {'key':'decision','type':'ENGAGEMENTDECISION','name':'Abriu?', 'configurationArguments':{'refActivityCustomerKey':'email1'},'outcomes':[{'key':'no','metaData':{'label':'Não'},'next':'sto'}]},
            {'key':'sto','type':'STOWAIT','configurationArguments':{'params':{'slidingWindowHours':12}},'outcomes':[{'key':'next','next':'message'}]},
            {'key':'message','type':'EMAILV2','outcomes':[]}]}
        p = journey_occurrence_paths(PackageStub(),graph)['message'][0]
        self.assertEqual(p[0]['engagement_reference'],'email1')
        self.assertEqual(p[0]['label'],'Não')
        self.assertEqual(p[1]['optimization_window_hours'],12)
        self.assertNotIn('wait',p[1])

    def test_reused_asset_does_not_merge_occurrences(self):
        graph = {'activities': [
            {'key':'split','type':'RANDOMSPLIT','outcomes':[{'key':'a','next':'email2'},{'key':'b','next':'email4'}]},
            {'key':'email2','type':'EMAILV2','configurationArguments':{'assetId':'90095'},'outcomes':[]},
            {'key':'email4','type':'EMAILV2','configurationArguments':{'assetId':'90095'},'outcomes':[]}]}
        paths = journey_occurrence_paths(PackageStub(),graph)
        self.assertIn('email2',paths)
        self.assertIn('email4',paths)
        self.assertNotEqual(paths['email2'],paths['email4'])

if __name__ == '__main__':
    unittest.main()
