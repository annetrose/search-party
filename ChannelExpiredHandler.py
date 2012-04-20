# SearchParty - Learning to Search in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from SearchPartyRequestHandler import SearchPartyRequestHandler

class ChannelExpiredHandler(SearchPartyRequestHandler):
    def post(self, lesson_code):           
        self.load_search_party_context(user_type="unknown")
        
        if self.is_teacher:
            token = self.create_channel(person_key=self.person.user.user_id(), lesson_code=lesson_code)
        
        elif self.is_student:
            token = self.create_channel(person_key=self.person.nickname, lesson_code=lesson_code)
        
        else:
            token = None
            
        from helpers import log
        log("=> CHANNEL EXPIRED. CREATED NEW CHANNEL: {0}".format(str(token)))
        
        import json
        data = { 'token': token, 'status': 1 }
        self.response.out.write(json.dumps(data))
        
